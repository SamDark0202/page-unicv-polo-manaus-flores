import { toSupabaseRenderImageUrl } from "@/lib/supabaseImage";

/**
 * Compatibilidade retroativa: mantém a API antiga usando o resolvedor atual
 * de imagens (ImageKit e Supabase).
 */
export function supabaseImgUrl(
  originalUrl: string,
  width = 800,
  quality = 80
): string {
  return toSupabaseRenderImageUrl(originalUrl, {
    width,
    quality,
    format: "webp",
  });
}
