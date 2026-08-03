import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { BOOKS } from "./books-data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = [
  { name: "Fiction", slug: "fiction", description: "Novels and literary fiction" },
  { name: "Non-Fiction", slug: "non-fiction", description: "Real-world stories and knowledge" },
  { name: "Mystery", slug: "mystery", description: "Thrillers and detective stories" },
  { name: "Romance", slug: "romance", description: "Love stories for every reader" },
  { name: "Sci-Fi & Fantasy", slug: "sci-fi-fantasy", description: "Other worlds and futures" },
  { name: "Children's Books", slug: "childrens", description: "Books for young readers" },
  { name: "Biography", slug: "biography", description: "Lives of remarkable people" },
  { name: "Self-Help", slug: "self-help", description: "Personal growth and wellness" },
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function seed() {
  console.log("Seeding Ilfaaz store...");

  const categoryMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const { data } = await supabase
      .from("store_categories")
      .upsert(cat, { onConflict: "slug" })
      .select("id, slug")
      .single();
    if (data) categoryMap.set(data.slug, data.id);
  }
  console.log(`Categories: ${categoryMap.size}`);

  let bookCount = 0;
  for (const book of BOOKS) {
    const slug = slugify(book.title);
    const { data: existing } = await supabase
      .from("store_books")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) continue;

    const { data: inserted, error } = await supabase
      .from("store_books")
      .insert({
        title: book.title,
        slug,
        author_name: book.author,
        description: `A captivating read by ${book.author}. This ${book.category.replace("-", " ")} book has delighted readers worldwide with its compelling narrative and unforgettable characters.`,
        cover_url: book.cover,
        is_bestseller: book.bestseller || false,
        is_new_release: book.newRelease || false,
        is_featured: book.featured || book.bestseller || false,
        is_prime_eligible: book.prime || false,
        is_first_reads: book.firstReads || false,
        is_audible_exclusive: book.audibleExclusive || false,
        avg_rating: 3.5 + Math.random() * 1.5,
        review_count: Math.floor(Math.random() * 5000) + 100,
        is_active: true,
        publisher: "Ilfaaz Publishing",
        page_count: 250 + Math.floor(Math.random() * 300),
        language: "English",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("Book error:", book.title, error?.message);
      continue;
    }

    await supabase.from("store_book_formats").insert([
      { book_id: inserted.id, format: "paperback", price: book.price, compare_at_price: book.price * 1.2, stock: 100 },
      { book_id: inserted.id, format: "hardcover", price: book.price + 8, compare_at_price: (book.price + 8) * 1.15, stock: 50 },
      ...(book.audiobook
        ? [{ book_id: inserted.id, format: "audiobook", price: book.price + 4, compare_at_price: (book.price + 4) * 1.1, stock: 999 }]
        : []),
    ]);

    const catId = categoryMap.get(book.category);
    if (catId) {
      await supabase.from("store_book_categories").insert({
        book_id: inserted.id,
        category_id: catId,
      });
    }

    bookCount++;
  }
  console.log(`Books seeded: ${bookCount}`);

  // Add audiobook formats to existing bestsellers without one
  const { data: allBestsellers } = await supabase
    .from("store_books")
    .select("id, title")
    .eq("is_bestseller", true)
    .eq("is_active", true)
    .limit(25);

  if (allBestsellers?.length) {
    for (const book of allBestsellers) {
      const { data: hasAudio } = await supabase
        .from("store_book_formats")
        .select("id")
        .eq("book_id", book.id)
        .eq("format", "audiobook")
        .maybeSingle();
      if (hasAudio) continue;

      const { data: paperback } = await supabase
        .from("store_book_formats")
        .select("price")
        .eq("book_id", book.id)
        .eq("format", "paperback")
        .maybeSingle();
      if (!paperback) continue;

      await supabase.from("store_book_formats").insert({
        book_id: book.id,
        format: "audiobook",
        price: Number(paperback.price) + 4,
        compare_at_price: Number(paperback.price) + 6,
        stock: 999,
      });
    }
    console.log("Audiobook formats added to bestsellers");
  }

  // Badge enrichment on existing books
  const badgeUpdates = [
    { match: "Midnight Library", prime: true },
    { match: "Atomic Habits", prime: true },
    { match: "Project Hail Mary", prime: true },
    { match: "Harry Potter", prime: true, audible: true },
    { match: "Silent Patient", firstReads: true },
    { match: "Day Break", prime: true },
    { match: "Seed", firstReads: true, featured: true },
  ];
  for (const u of badgeUpdates) {
    const { data: matches } = await supabase
      .from("store_books")
      .select("id")
      .ilike("title", `%${u.match}%`);
    for (const m of matches || []) {
      const patch: Record<string, boolean> = {};
      if (u.prime) patch.is_prime_eligible = true;
      if (u.firstReads) patch.is_first_reads = true;
      if (u.audible) patch.is_audible_exclusive = true;
      if (u.featured) patch.is_featured = true;
      if (Object.keys(patch).length) {
        await supabase.from("store_books").update(patch).eq("id", m.id);
      }
    }
  }

  // Lightning deals on random bestsellers
  const { data: bestsellers } = await supabase
    .from("store_books")
    .select("id, title")
    .eq("is_bestseller", true)
    .eq("is_active", true)
    .limit(12);

  if (bestsellers?.length) {
    const now = new Date();
    const ends = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const shortEnds = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    let dealCount = 0;
    for (const book of bestsellers) {
      const { data: format } = await supabase
        .from("store_book_formats")
        .select("id, price")
        .eq("book_id", book.id)
        .eq("format", "paperback")
        .maybeSingle();
      if (!format) continue;

      const { data: existingDeal } = await supabase
        .from("store_deals")
        .select("id")
        .eq("book_id", book.id)
        .maybeSingle();
      if (existingDeal) continue;

      const dealPrice = Math.round(Number(format.price) * 0.75 * 100) / 100;
      await supabase.from("store_deals").insert({
        book_id: book.id,
        format_id: format.id,
        deal_price: dealPrice,
        starts_at: now.toISOString(),
        ends_at: dealCount < 6 ? shortEnds.toISOString() : ends.toISOString(),
        is_active: true,
      });
      dealCount++;
    }
    console.log(`Deals seeded: ${dealCount}`);
  }

  await supabase.from("store_coupons").upsert(
    { code: "WELCOME10", description: "10% off your first order", discount_kind: "percent", discount_value: 10, is_active: true },
    { onConflict: "code" }
  );

  await supabase.from("store_content_pages").upsert(
    [
      { slug: "about", title: "About Ilfaaz", body: "Ilfaaz is your destination for millions of books, delivered fast across the United Kingdom.", is_published: true },
      { slug: "help", title: "Help Centre", body: "Need assistance? Contact our support team at help@ilfaaz.com", is_published: true },
      { slug: "returns", title: "Returns Policy", body: "You can return most items within 30 days of receipt for a full refund.", is_published: true },
    ],
    { onConflict: "slug" }
  );

  const { count } = await supabase.from("store_books").select("*", { count: "exact", head: true });
  console.log(`Total books in catalog: ${count}`);

  const homepageSections = [
    {
      section_type: "filter_pills",
      title: "Filter by",
      subtitle: null,
      config: {
        pills: [
          { label: "Print Books", href: "/books?format=print" },
          { label: "Audible Audiobooks", href: "/books?format=audiobook" },
        ],
      },
      sort_order: 1,
    },
    {
      section_type: "book_row",
      title: "Best sellers in print",
      subtitle: null,
      config: { filter: "bestseller", format: "print", limit: 12, see_more_href: "/books?format=print&sort=bestseller" },
      sort_order: 2,
    },
    {
      section_type: "book_row",
      title: "New releases in print",
      subtitle: null,
      config: { filter: "new_release", format: "print", limit: 12, see_more_href: "/books?format=print&sort=newest" },
      sort_order: 3,
    },
    {
      section_type: "carousel",
      title: "Today's Deals",
      subtitle: "Limited-time savings",
      config: { source: "deals", limit: 12, see_more_href: "/deals" },
      sort_order: 4,
    },
    {
      section_type: "book_row",
      title: "Best sellers in Original books",
      subtitle: null,
      config: { filter: "featured", limit: 12, see_more_href: "/books?sort=bestseller" },
      sort_order: 5,
    },
    {
      section_type: "book_row",
      title: "Best sellers on Audible",
      subtitle: null,
      config: { filter: "bestseller", format: "audiobook", limit: 12, see_more_href: "/books?format=audiobook&sort=bestseller" },
      sort_order: 6,
    },
    {
      section_type: "book_row",
      title: "Most popular listens",
      subtitle: null,
      config: { format: "audiobook", limit: 12, see_more_href: "/books?format=audiobook" },
      sort_order: 7,
    },
    {
      section_type: "editorial",
      title: "Why Ilfaaz?",
      subtitle: "Millions of titles, fast delivery, easy returns",
      config: { cta: { label: "Browse all books", href: "/books" } },
      sort_order: 8,
    },
  ];

  await supabase.from("store_homepage_sections").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("store_homepage_sections").insert(homepageSections);
  console.log(`Homepage sections seeded: ${homepageSections.length}`);

  console.log("Seed complete!");
}

seed().catch(console.error);
