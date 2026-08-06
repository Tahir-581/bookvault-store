/**
 * Script #1: Validate product CSV(s), match cover images, derive price from
 * pages via pricing.csv (round up), normalize data for Script #2.
 *
 * Usage: npm run books:prepare
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const CSV_DIR = path.join(ROOT, "product-listing-data");
const PRICING_CSV = path.join(CSV_DIR, "pricing.csv");
const COVERS_DIR = "/home/tahir/Tahir/10-books-store/1-raw-book-covers";
const OUT_BOOKS = path.join(CSV_DIR, "prepared-books.json");
const OUT_REPORT = path.join(CSV_DIR, "prepare-report.json");
const PRICING_FILENAME = "pricing.csv";

type PriceTier = { pages: number; price: number };

const BADGE_MAP: Record<string, keyof PreparedBadges> = {
  bestseller: "is_bestseller",
  featured: "is_featured",
  trending: "is_trending",
  "new release": "is_new_release",
};

export type PreparedBadges = {
  is_bestseller: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_new_release: boolean;
};

export type PreparedBook = {
  title: string;
  slug: string;
  author: string;
  description: string;
  page_count: number;
  price: number;
  categories: string[];
  tags: string[];
  badges: PreparedBadges;
  cover_path: string;
  source_csv: string;
  source_row: number;
};

type RowError = {
  source_csv: string;
  source_row: number;
  title?: string;
  errors: string[];
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Normalize for cover filename ↔ title matching. */
function normalizeMatchKey(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function coverStem(filename: string) {
  const base = filename.replace(/\.(jpe?g|png|webp|gif)$/i, "");
  return base.replace(/^\d+-/, "");
}

/** Minimal RFC4180-ish CSV parser (quoted fields, escaped quotes). */
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // Skip trailing empty line
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  while (i < content.length) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      pushField();
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      pushField();
      pushRow();
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  return rows;
}

function splitList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getCol(headers: string[], row: string[], names: string[]): string {
  for (const name of names) {
    const idx = headers.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
    if (idx >= 0) return (row[idx] ?? "").trim();
  }
  return "";
}

function hasHeader(headers: string[], names: string[]): boolean {
  return names.some((name) =>
    headers.some((h) => h.trim().toLowerCase() === name.toLowerCase())
  );
}

function parsePositiveInt(raw: string, label: string): { value?: number; error?: string } {
  if (!raw) return { error: `${label} is required` };
  if (!/^\d+$/.test(raw)) return { error: `${label} must be a whole number` };
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return { error: `${label} must be a positive whole number` };
  return { value: n };
}

function splitBadgesAndTags(rawTags: string): { badges: PreparedBadges; tags: string[] } {
  const badges: PreparedBadges = {
    is_bestseller: false,
    is_featured: false,
    is_trending: false,
    is_new_release: false,
  };
  const tags: string[] = [];
  const seen = new Set<string>();

  for (const item of splitList(rawTags)) {
    const key = item.toLowerCase();
    const badgeField = BADGE_MAP[key];
    if (badgeField) {
      badges[badgeField] = true;
      continue;
    }
    const dedupe = item.toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    tags.push(item);
  }

  return { badges, tags };
}

function buildCoverIndex(coversDir: string): {
  byKey: Map<string, string[]>;
  error?: string;
} {
  if (!fs.existsSync(coversDir)) {
    return { byKey: new Map(), error: `Covers directory not found: ${coversDir}` };
  }

  const byKey = new Map<string, string[]>();
  for (const name of fs.readdirSync(coversDir)) {
    const full = path.join(coversDir, name);
    if (!fs.statSync(full).isFile()) continue;
    if (!/\.(jpe?g|png|webp|gif)$/i.test(name)) continue;
    const key = normalizeMatchKey(coverStem(name));
    if (!key) continue;
    const list = byKey.get(key) || [];
    list.push(full);
    byKey.set(key, list);
  }
  return { byKey };
}

function resolveCover(
  title: string,
  byKey: Map<string, string[]>
): { path?: string; error?: string } {
  const key = normalizeMatchKey(title);
  const matches = byKey.get(key) || [];
  if (matches.length === 0) {
    return { error: `No cover image matched title "${title}"` };
  }
  if (matches.length > 1) {
    return {
      error: `Ambiguous cover match for "${title}": ${matches.map((p) => path.basename(p)).join(", ")}`,
    };
  }
  return { path: matches[0] };
}

function loadPricingTiers(pricingPath: string): {
  tiers?: PriceTier[];
  minPages?: number;
  maxPages?: number;
  error?: string;
} {
  if (!fs.existsSync(pricingPath)) {
    return { error: `Pricing sheet not found: ${pricingPath}` };
  }

  const table = parseCsv(fs.readFileSync(pricingPath, "utf8"));
  if (table.length < 2) {
    return { error: "pricing.csv has no data rows" };
  }

  const headers = table[0].map((h) => h.replace(/^\uFEFF/, "").trim());
  const pagesIdx = headers.findIndex((h) => h.toLowerCase() === "pages");
  const priceIdx = headers.findIndex(
    (h) => h.toLowerCase() === "selling price" || h.toLowerCase() === "price"
  );

  if (pagesIdx < 0 || priceIdx < 0) {
    return {
      error:
        'pricing.csv must have "Pages" and "Selling Price" columns',
    };
  }

  const tiers: PriceTier[] = [];
  for (let r = 1; r < table.length; r++) {
    const row = table[r];
    const pagesRaw = (row[pagesIdx] ?? "").trim();
    const priceRaw = (row[priceIdx] ?? "").trim();
    if (!pagesRaw && !priceRaw) continue;

    const pages = parsePositiveInt(pagesRaw, "pricing Pages");
    const price = parsePositiveInt(priceRaw, "pricing Selling Price");
    if (pages.error || price.error) {
      return {
        error: `pricing.csv row ${r + 1}: ${pages.error || price.error}`,
      };
    }
    tiers.push({ pages: pages.value!, price: price.value! });
  }

  if (tiers.length === 0) {
    return { error: "pricing.csv has no valid price tiers" };
  }

  tiers.sort((a, b) => a.pages - b.pages);
  return {
    tiers,
    minPages: tiers[0].pages,
    maxPages: tiers[tiers.length - 1].pages,
  };
}

/** Round up to smallest tier with pages >= pageCount. */
function priceFromPages(
  pageCount: number,
  tiers: PriceTier[],
  minPages: number,
  maxPages: number
): { price?: number; error?: string } {
  if (pageCount < minPages || pageCount > maxPages) {
    return {
      error: `Pages ${pageCount} outside pricing sheet range (${minPages}–${maxPages})`,
    };
  }
  const tier = tiers.find((t) => t.pages >= pageCount);
  if (!tier) {
    return {
      error: `Pages ${pageCount} outside pricing sheet range (${minPages}–${maxPages})`,
    };
  }
  return { price: tier.price };
}

function main() {
  if (!fs.existsSync(CSV_DIR)) {
    console.error(`CSV directory not found: ${CSV_DIR}`);
    process.exit(1);
  }

  const pricing = loadPricingTiers(PRICING_CSV);
  if (pricing.error || !pricing.tiers || pricing.minPages == null || pricing.maxPages == null) {
    console.error(pricing.error || "Failed to load pricing.csv");
    process.exit(1);
  }

  const csvFiles = fs
    .readdirSync(CSV_DIR)
    .filter(
      (f) =>
        f.toLowerCase().endsWith(".csv") &&
        f.toLowerCase() !== PRICING_FILENAME
    )
    .sort();

  if (csvFiles.length === 0) {
    console.error(`No product listing CSV files found in ${CSV_DIR}`);
    process.exit(1);
  }

  const coverIndex = buildCoverIndex(COVERS_DIR);
  const rowErrors: RowError[] = [];
  const books: PreparedBook[] = [];
  const seenSlugs = new Map<string, string>();

  if (coverIndex.error) {
    console.error(coverIndex.error);
    process.exit(1);
  }

  for (const file of csvFiles) {
    const csvPath = path.join(CSV_DIR, file);
    const content = fs.readFileSync(csvPath, "utf8");
    const table = parseCsv(content);
    if (table.length < 2) {
      rowErrors.push({
        source_csv: file,
        source_row: 0,
        errors: ["CSV has no data rows"],
      });
      continue;
    }

    const headers = table[0].map((h) => h.replace(/^\uFEFF/, "").trim());

    if (!hasHeader(headers, ["Book"])) {
      rowErrors.push({
        source_csv: file,
        source_row: 0,
        errors: ["Missing required column: Book"],
      });
      continue;
    }

    for (let r = 1; r < table.length; r++) {
      const row = table[r];
      const sourceRow = r + 1; // 1-based spreadsheet row
      const errors: string[] = [];

      const title = getCol(headers, row, ["Book"]);
      const author = getCol(headers, row, ["Author"]);
      const description = getCol(headers, row, ["Description"]);
      const categoryRaw = getCol(headers, row, ["Category"]);
      const pagesRaw = getCol(headers, row, ["Pages*", "Pages"]);
      const tagsRaw = getCol(headers, row, ["Tags"]);

      if (!title) errors.push("Book (title) is required");
      if (!author) errors.push("Author is required");
      if (!description) errors.push("Description is required");
      if (!categoryRaw) errors.push("Category is required");

      const pages = parsePositiveInt(pagesRaw, "Pages");
      if (pages.error) errors.push(pages.error);

      let resolvedPrice: number | undefined;
      if (pages.value != null) {
        const priced = priceFromPages(
          pages.value,
          pricing.tiers,
          pricing.minPages,
          pricing.maxPages
        );
        if (priced.error) errors.push(priced.error);
        else resolvedPrice = priced.price;
      }

      const slug = title ? slugify(title) : "";
      if (title && !slug) errors.push("Could not derive slug from title");

      if (slug && seenSlugs.has(slug)) {
        errors.push(`Duplicate slug "${slug}" (also in ${seenSlugs.get(slug)})`);
      }

      let coverPath: string | undefined;
      if (title) {
        const cover = resolveCover(title, coverIndex.byKey);
        if (cover.error) errors.push(cover.error);
        else coverPath = cover.path;
      }

      if (errors.length > 0) {
        rowErrors.push({
          source_csv: file,
          source_row: sourceRow,
          title: title || undefined,
          errors,
        });
        continue;
      }

      const categories = splitList(categoryRaw);
      if (categories.length === 0) {
        rowErrors.push({
          source_csv: file,
          source_row: sourceRow,
          title,
          errors: ["Category is required"],
        });
        continue;
      }

      const { badges, tags } = splitBadgesAndTags(tagsRaw);
      seenSlugs.set(slug, `${file}:${sourceRow}`);

      books.push({
        title,
        slug,
        author,
        description,
        page_count: pages.value!,
        price: resolvedPrice!,
        categories,
        tags,
        badges,
        cover_path: coverPath!,
        source_csv: file,
        source_row: sourceRow,
      });
    }
  }

  books.sort((a, b) => a.title.localeCompare(b.title, "en"));

  const report = {
    generated_at: new Date().toISOString(),
    csv_files: csvFiles,
    pricing_csv: PRICING_CSV,
    pricing_tiers: pricing.tiers.length,
    pricing_range: { min: pricing.minPages, max: pricing.maxPages },
    covers_dir: COVERS_DIR,
    cover_files_indexed: coverIndex.byKey.size,
    total_rows_ok: books.length,
    total_rows_failed: rowErrors.length,
    errors: rowErrors,
  };

  fs.mkdirSync(CSV_DIR, { recursive: true });

  if (rowErrors.length > 0) {
    fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2));
    // Do not write prepared-books.json on failure (avoid stale/partial import)
    if (fs.existsSync(OUT_BOOKS)) {
      fs.unlinkSync(OUT_BOOKS);
    }
    console.error(
      `Prepare failed: ${rowErrors.length} row(s) invalid. See ${OUT_REPORT}`
    );
    for (const err of rowErrors.slice(0, 10)) {
      console.error(
        `  ${err.source_csv}:${err.source_row} ${err.title || ""} — ${err.errors.join("; ")}`
      );
    }
    if (rowErrors.length > 10) {
      console.error(`  … and ${rowErrors.length - 10} more`);
    }
    process.exit(1);
  }

  fs.writeFileSync(OUT_BOOKS, JSON.stringify({ books }, null, 2));
  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2));

  console.log(`Prepared ${books.length} book(s) → ${OUT_BOOKS}`);
  console.log(`Report → ${OUT_REPORT}`);
}

main();
