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
const IMAGEKIT_URL_ENDPOINT = (import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT ?? "").replace(/\/+$/, "");
const IMAGEKIT_TRANSFORMS_ENABLED = import.meta.env.VITE_IMAGEKIT_TRANSFORMS !== "false";

function isImageKitUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("imagekit.io")) {
      return true;
    }
    return Boolean(IMAGEKIT_URL_ENDPOINT && url.startsWith(IMAGEKIT_URL_ENDPOINT));
  } catch {
    return Boolean(IMAGEKIT_URL_ENDPOINT && url.startsWith(IMAGEKIT_URL_ENDPOINT));
  }
}

function buildImageKitTransform(options: SupabaseImageOptions) {
  const transforms: string[] = [];

  if (options.width) transforms.push(`w-${options.width}`);
  if (options.height) transforms.push(`h-${options.height}`);
  if (options.quality) transforms.push(`q-${options.quality}`);
  if (options.format && options.format !== "origin") transforms.push(`f-${options.format}`);

  return transforms.join(",");
}

function toImageKitTransformUrl(url: string, options: SupabaseImageOptions) {
  if (!IMAGEKIT_TRANSFORMS_ENABLED) {
    return url;
  }

  const tr = buildImageKitTransform(options);
  if (!tr) {
    return url;
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("tr", tr);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function toSupabaseRenderImageUrl(url: string, options: SupabaseImageOptions = {}): string {
  if (!url) {
    return url;
  }

  if (isImageKitUrl(url)) {
    return toImageKitTransformUrl(url, options);
  }

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
