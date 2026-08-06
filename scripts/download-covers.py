#!/usr/bin/env python3
"""
Download book cover images for product listing CSVs.

Sources: Open Library first, then Google Books API fallback.
Only high-confidence matches are saved; weak/missing hits go to covers-review.json.

Usage:
  1. (Recommended for fallback) Add a free Google Books API key to .env.local:
       GOOGLE_BOOKS_API_KEY=your_key_here

     How to get a key:
       - https://console.cloud.google.com/
       - Create/select a project
       - APIs & Services → Library → enable "Books API"
       - Credentials → Create credentials → API key
       - (Recommended) Restrict the key to Books API only

  2. python3 scripts/download-covers.py

  3. Review product-listing-data/covers-review.json and add any missing
     covers manually into the covers folder.

  4. Continue the import pipeline:
       npm run books:prepare
       npm run books:import

Covers folder: /home/tahir/Tahir/10-books-store/1-raw-book-covers
Filenames: {N}-{Title}.jpg  (N continues after the highest existing prefix)
"""

from __future__ import annotations

import csv
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
CSV_DIR = ROOT / "product-listing-data"
COVERS_DIR = Path("/home/tahir/Tahir/10-books-store/1-raw-book-covers")
ENV_LOCAL = ROOT / ".env.local"
OUT_REPORT = CSV_DIR / "covers-download-report.json"
OUT_REVIEW = CSV_DIR / "covers-review.json"

PRICING_FILENAME = "pricing.csv"
MAX_COVER_BYTES = 5 * 1024 * 1024
REQUEST_DELAY_SEC = 0.75
USER_AGENT = "ilfaaz-books-cover-downloader/1.0 (local; contact=local)"

IMAGE_EXT_RE = re.compile(r"\.(jpe?g|png|webp|gif)$", re.I)
LEADING_NUM_RE = re.compile(r"^(\d+)-")


def load_env_local(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.is_file():
        return env
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line[len("export ") :]
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key:
            env[key] = value
    return env


def normalize_match_key(s: str) -> str:
    s = s.lower().replace("&", "and")
    return re.sub(r"[^a-z0-9]+", "", s)


def cover_stem(filename: str) -> str:
    base = IMAGE_EXT_RE.sub("", filename)
    return re.sub(r"^\d+-", "", base)


def title_match(csv_title: str, result_title: str) -> bool:
    a = normalize_match_key(csv_title)
    b = normalize_match_key(result_title)
    if not a or not b:
        return False
    if a == b:
        return True
    shorter, longer = (a, b) if len(a) <= len(b) else (b, a)
    if shorter not in longer:
        return False
    return (len(shorter) / len(longer)) >= 0.85


def author_match(csv_author: str, result_authors: str) -> bool:
    csv_author = (csv_author or "").strip()
    if not csv_author:
        return True
    hay = normalize_match_key(result_authors or "")
    if not hay:
        return False
    tokens = [
        normalize_match_key(t)
        for t in re.split(r"[\s,;/&]+", csv_author)
        if len(normalize_match_key(t)) >= 3
    ]
    if not tokens:
        # Author present but no usable tokens — require full normalized containment
        return normalize_match_key(csv_author) in hay
    return any(t in hay for t in tokens)


def sanitize_filename_title(title: str) -> str:
    # Keep spaces/punctuation similar to existing covers; strip path-unsafe chars.
    cleaned = title.strip()
    cleaned = cleaned.replace("/", "-").replace("\\", "-").replace("\0", "")
    cleaned = re.sub(r"[\r\n\t]+", " ", cleaned)
    cleaned = cleaned.strip(" .")
    return cleaned or "cover"


def http_get(
    url: str,
    *,
    timeout: float = 30.0,
    binary: bool = False,
) -> tuple[Any, str | None]:
    """Returns (parsed_json_or_bytes, error). Retries once on 429/5xx."""
    last_err: str | None = None
    for attempt in range(2):
        time.sleep(REQUEST_DELAY_SEC)
        req = urllib.request.Request(
            url,
            headers={"User-Agent": USER_AGENT, "Accept": "*/*"},
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read()
                if binary:
                    return data, None
                text = data.decode("utf-8", errors="replace")
                return json.loads(text), None
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code}: {e.reason}"
            if e.code in (429, 500, 502, 503, 504) and attempt == 0:
                time.sleep(2.0)
                continue
            return None, last_err
        except Exception as e:  # noqa: BLE001
            last_err = str(e)
            if attempt == 0:
                time.sleep(1.0)
                continue
            return None, last_err
    return None, last_err or "request failed"


def index_covers(covers_dir: Path) -> tuple[dict[str, list[str]], int]:
    """Map normalized title → filenames; return next numeric prefix."""
    by_key: dict[str, list[str]] = {}
    max_n = 0
    if not covers_dir.is_dir():
        return by_key, 1

    for path in covers_dir.iterdir():
        if not path.is_file():
            continue
        name = path.name
        if not IMAGE_EXT_RE.search(name):
            continue
        m = LEADING_NUM_RE.match(name)
        if m:
            max_n = max(max_n, int(m.group(1)))
        key = normalize_match_key(cover_stem(name))
        if not key:
            continue
        by_key.setdefault(key, []).append(name)
    return by_key, max_n + 1


def load_listing_books(csv_dir: Path) -> list[dict[str, Any]]:
    books: list[dict[str, Any]] = []
    csv_files = sorted(
        f
        for f in csv_dir.iterdir()
        if f.is_file()
        and f.suffix.lower() == ".csv"
        and f.name.lower() != PRICING_FILENAME
    )
    for csv_path in csv_files:
        with csv_path.open(newline="", encoding="utf-8-sig") as fh:
            reader = csv.DictReader(fh)
            if not reader.fieldnames:
                continue
            # Normalize header keys
            field_map = {h: h for h in reader.fieldnames}

            def col(row: dict[str, str | None], *names: str) -> str:
                for name in names:
                    for header in field_map:
                        if header and header.strip().lower() == name.lower():
                            return (row.get(header) or "").strip()
                return ""

            for i, row in enumerate(reader, start=2):
                title = col(row, "Book")
                author = col(row, "Author")
                if not title:
                    continue
                books.append(
                    {
                        "title": title,
                        "author": author,
                        "source_csv": csv_path.name,
                        "source_row": i,
                    }
                )
    return books


def search_open_library(
    title: str, author: str
) -> tuple[list[dict[str, Any]], str | None, str]:
    params = {"title": title, "limit": "10"}
    if author:
        params["author"] = author
    url = "https://openlibrary.org/search.json?" + urllib.parse.urlencode(params)
    data, err = http_get(url)
    if err or not isinstance(data, dict):
        return [], err or "invalid Open Library response", url
    docs = data.get("docs") or []
    candidates: list[dict[str, Any]] = []
    for doc in docs:
        result_title = doc.get("title") or ""
        authors = ", ".join(doc.get("author_name") or [])
        cover_i = doc.get("cover_i")
        cover_url = None
        if cover_i:
            cover_url = f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg"
        candidates.append(
            {
                "source": "open_library",
                "title": result_title,
                "authors": authors,
                "cover_url": cover_url,
            }
        )
    return candidates, None, url


def search_google_books(
    title: str, author: str, api_key: str
) -> tuple[list[dict[str, Any]], str | None, str]:
    q_parts = [f'intitle:"{title}"']
    if author:
        q_parts.append(f'inauthor:"{author}"')
    params = {
        "q": " ".join(q_parts),
        "maxResults": "10",
        "printType": "books",
        "key": api_key,
    }
    url = "https://www.googleapis.com/books/v1/volumes?" + urllib.parse.urlencode(
        params
    )
    # Redacted URL for reports (no API key)
    report_url = "https://www.googleapis.com/books/v1/volumes?" + urllib.parse.urlencode(
        {k: v for k, v in params.items() if k != "key"}
    )
    data, err = http_get(url)
    if err or not isinstance(data, dict):
        return [], err or "invalid Google Books response", report_url
    items = data.get("items") or []
    candidates: list[dict[str, Any]] = []
    for item in items:
        info = item.get("volumeInfo") or {}
        result_title = info.get("title") or ""
        authors = ", ".join(info.get("authors") or [])
        image_links = info.get("imageLinks") or {}
        cover_url = (
            image_links.get("extraLarge")
            or image_links.get("large")
            or image_links.get("medium")
            or image_links.get("thumbnail")
            or image_links.get("smallThumbnail")
        )
        if cover_url and cover_url.startswith("http://"):
            cover_url = "https://" + cover_url[len("http://") :]
        # Prefer zoomed Google cover when thumbnail-style URL
        if cover_url and "zoom=" in cover_url:
            cover_url = re.sub(r"zoom=\d", "zoom=1", cover_url)
        candidates.append(
            {
                "source": "google_books",
                "title": result_title,
                "authors": authors,
                "cover_url": cover_url,
            }
        )
    return candidates, None, report_url


def pick_confident(
    csv_title: str, csv_author: str, candidates: list[dict[str, Any]]
) -> tuple[dict[str, Any] | None, str]:
    """Return (accepted_candidate, reject_reason_if_none)."""
    if not candidates:
        return None, "no_results"

    saw_title_ok = False
    saw_author_fail = False
    saw_no_cover = False

    for c in candidates:
        if not title_match(csv_title, c.get("title") or ""):
            continue
        saw_title_ok = True
        if not author_match(csv_author, c.get("authors") or ""):
            saw_author_fail = True
            continue
        if not c.get("cover_url"):
            saw_no_cover = True
            continue
        return c, ""

    if not saw_title_ok:
        return None, "title_mismatch"
    if saw_author_fail and not saw_no_cover:
        return None, "author_mismatch"
    if saw_no_cover:
        return None, "no_cover"
    return None, "title_mismatch"


def download_cover(url: str) -> tuple[bytes | None, str | None]:
    data, err = http_get(url, binary=True)
    if err or data is None:
        return None, err or "download_failed"
    if not isinstance(data, (bytes, bytearray)):
        return None, "download_failed"
    if len(data) > MAX_COVER_BYTES:
        return None, "too_large"
    if len(data) < 100:
        return None, "download_failed"
    return bytes(data), None


def main() -> int:
    if not CSV_DIR.is_dir():
        print(f"CSV directory not found: {CSV_DIR}")
        return 1
    if not COVERS_DIR.is_dir():
        print(f"Covers directory not found: {COVERS_DIR}")
        return 1

    env = load_env_local(ENV_LOCAL)
    api_key = (
        os.environ.get("GOOGLE_BOOKS_API_KEY")
        or env.get("GOOGLE_BOOKS_API_KEY")
        or ""
    ).strip()

    books = load_listing_books(CSV_DIR)
    if not books:
        print(f"No books found in listing CSVs under {CSV_DIR}")
        return 1

    cover_index, next_n = index_covers(COVERS_DIR)

    results: list[dict[str, Any]] = []
    review: list[dict[str, Any]] = []
    downloaded = 0
    skipped = 0
    failed = 0

    print(f"Books in CSV: {len(books)}")
    print(f"Covers dir: {COVERS_DIR}")
    print(f"Next file index: {next_n}")
    print(f"Google Books API key: {'yes' if api_key else 'no (Open Library only)'}")
    print()

    for book in books:
        title = book["title"]
        author = book["author"]
        key = normalize_match_key(title)
        base_row = {
            "title": title,
            "author": author,
            "source_csv": book["source_csv"],
            "source_row": book["source_row"],
        }

        existing = cover_index.get(key) or []
        if existing:
            skipped += 1
            row = {
                **base_row,
                "status": "skipped_existing",
                "existing_files": existing,
            }
            results.append(row)
            print(f"  [SKIP] {title}")
            continue

        # Open Library
        ol_cands, ol_err, ol_url = search_open_library(title, author)
        accepted, reason = pick_confident(title, author, ol_cands)
        search_urls = {"open_library": ol_url}
        source_used = None

        if accepted:
            source_used = "open_library"
        else:
            # Fall back to Google Books
            if not api_key:
                ol_part = ol_err or reason or "no_results"
                fail_reason = (
                    "missing_google_books_api_key"
                    if ol_part == "no_results"
                    else f"{ol_part};missing_google_books_api_key"
                )
                failed += 1
                rev = {
                    **base_row,
                    "reason": fail_reason,
                    "search_urls": search_urls,
                }
                review.append(rev)
                results.append({**base_row, "status": "review", "reason": fail_reason})
                print(f"  [REVIEW] {title} — {fail_reason}")
                continue

            gb_cands, gb_err, gb_url = search_google_books(title, author, api_key)
            search_urls["google_books"] = gb_url
            accepted, reason = pick_confident(title, author, gb_cands)
            if accepted:
                source_used = "google_books"
            else:
                fail_reason = gb_err or reason or ol_err or "no_results"
                failed += 1
                rev = {
                    **base_row,
                    "reason": fail_reason,
                    "search_urls": search_urls,
                }
                review.append(rev)
                results.append({**base_row, "status": "review", "reason": fail_reason})
                print(f"  [REVIEW] {title} — {fail_reason}")
                continue

        assert accepted is not None and source_used is not None
        cover_url = accepted["cover_url"]
        blob, dl_err = download_cover(cover_url)
        if dl_err or blob is None:
            fail_reason = dl_err or "download_failed"
            failed += 1
            rev = {
                **base_row,
                "reason": fail_reason,
                "search_urls": search_urls,
                "attempted_cover_url": cover_url,
                "source": source_used,
            }
            review.append(rev)
            results.append({**base_row, "status": "review", "reason": fail_reason})
            print(f"  [REVIEW] {title} — {fail_reason}")
            continue

        safe_title = sanitize_filename_title(title)
        filename = f"{next_n}-{safe_title}.jpg"
        dest = COVERS_DIR / filename
        # Avoid clobbering an unexpected existing path
        while dest.exists():
            next_n += 1
            filename = f"{next_n}-{safe_title}.jpg"
            dest = COVERS_DIR / filename

        try:
            dest.write_bytes(blob)
        except OSError as e:
            fail_reason = f"download_failed: {e}"
            failed += 1
            review.append(
                {
                    **base_row,
                    "reason": fail_reason,
                    "search_urls": search_urls,
                }
            )
            results.append({**base_row, "status": "review", "reason": fail_reason})
            print(f"  [REVIEW] {title} — {fail_reason}")
            continue

        cover_index.setdefault(key, []).append(filename)
        downloaded += 1
        results.append(
            {
                **base_row,
                "status": "downloaded",
                "source": source_used,
                "file": filename,
                "matched_title": accepted.get("title"),
                "matched_authors": accepted.get("authors"),
                "cover_url": cover_url,
            }
        )
        print(f"  [OK] {title} → {filename} ({source_used})")
        next_n += 1

    report = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "covers_dir": str(COVERS_DIR),
        "google_books_key_present": bool(api_key),
        "total": len(books),
        "downloaded": downloaded,
        "skipped_existing": skipped,
        "review": failed,
        "results": results,
    }

    CSV_DIR.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    OUT_REVIEW.write_text(
        json.dumps(
            {
                "generated_at": report["generated_at"],
                "count": len(review),
                "books": review,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print()
    print(
        f"Done: {downloaded} downloaded, {skipped} skipped, {failed} need review"
    )
    print(f"Report → {OUT_REPORT}")
    print(f"Review → {OUT_REVIEW}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
