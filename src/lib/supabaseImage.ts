type SupabaseImageOptions = {
  width?: number;
  height?: number;
  quality?: number;
  format?: "origin" | "webp" | "avif";
  resize?: "cover" | "contain" | "fill";
};

const OBJECT_PUBLIC_SEGMENT = "/storage/v1/object/public/";
const RENDER_PUBLIC_SEGMENT = "/storage/v1/render/image/public/";
const IMAGE_TRANSFORMS_ENABLED = import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORMS === "true";

export function toSupabaseRenderImageUrl(url: string, options: SupabaseImageOptions = {}): string {
  // Keep original public URL unless transforms are explicitly enabled.
  if (!IMAGE_TRANSFORMS_ENABLED) {
    return url;
  }

  if (!url || !url.includes(OBJECT_PUBLIC_SEGMENT)) {
    return url;
  }

  const {
    width,
    height,
    quality = 70,
    format = "webp",
    resize = "cover",
  } = options;

  const base = url.replace(OBJECT_PUBLIC_SEGMENT, RENDER_PUBLIC_SEGMENT);

  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  if (quality) params.set("quality", String(quality));
  if (format) params.set("format", format);
  if (resize) params.set("resize", resize);

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
