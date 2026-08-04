import { COVER_BUCKET } from "@/lib/constants";

export const COVER_MAX_BYTES = 5 * 1024 * 1024;
export const COVER_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isGoogleDriveShareUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      host === "drive.google.com" ||
      host === "docs.google.com" ||
      host.endsWith(".googleusercontent.com")
    );
  } catch {
    return false;
  }
}

export function validateCoverFile(file: File): string | null {
  if (!COVER_ALLOWED_TYPES.has(file.type)) {
    return "Cover must be a JPG, PNG, WebP, or GIF image.";
  }
  if (file.size > COVER_MAX_BYTES) {
    return "Cover image must be 5 MB or smaller.";
  }
  return null;
}

export function validateCoverUrl(url: string): string | null {
  if (!url) return null;
  if (isGoogleDriveShareUrl(url)) {
    return "Google Drive links cannot be used. Upload the image file instead.";
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return "Cover URL must use HTTPS.";
    }
  } catch {
    return "Cover URL is not valid.";
  }
  return null;
}

export function buildCoverObjectPath(baseName: string, mimeType: string): string {
  const safe = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "cover";
  const ext = EXT_BY_TYPE[mimeType] || "jpg";
  return `covers/${safe}-${Date.now()}.${ext}`;
}

export function getCoverPublicUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${COVER_BUCKET}/${path}`;
}

/** Extract storage object path from a public URL for our cover bucket, or null. */
export function parseCoverStoragePath(publicUrl: string): string | null {
  if (!publicUrl) return null;
  try {
    const pathname = new URL(publicUrl).pathname;
    const marker = `/storage/v1/object/public/${COVER_BUCKET}/`;
    const idx = pathname.indexOf(marker);
    if (idx === -1) return null;
    const path = decodeURIComponent(pathname.slice(idx + marker.length));
    return path || null;
  } catch {
    return null;
  }
}

type StorageRemover = {
  storage: {
    from: (bucket: string) => {
      remove: (
        paths: string[]
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
};

/** Delete a bucket-hosted cover. No-op for external URLs. */
export async function deleteStoredCover(
  supabase: StorageRemover,
  publicUrl: string | null | undefined
): Promise<{ deleted: boolean; error?: string }> {
  if (!publicUrl) return { deleted: false };

  const path = parseCoverStoragePath(publicUrl);
  if (!path) return { deleted: false };

  const { error } = await supabase.storage.from(COVER_BUCKET).remove([path]);
  if (error) {
    return {
      deleted: false,
      error: error.message || "Failed to delete cover from storage",
    };
  }
  return { deleted: true };
}

export { COVER_BUCKET };
