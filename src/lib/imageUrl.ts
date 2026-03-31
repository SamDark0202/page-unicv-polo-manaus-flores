/**
 * Converte qualquer URL pública do Supabase Storage para a URL de render
 * com transformação e cache CDN ativado.
 *
 * Uso:
 *   supabaseImgUrl(url)              → largura 800, qualidade 80 (padrão)
 *   supabaseImgUrl(url, 400)         → largura 400, qualidade 80
 *   supabaseImgUrl(url, 1200, 90)    → largura 1200, qualidade 90
 *
 * Retorna a URL original intacta se ela não for do Supabase Storage,
 * garantindo que o utilitário seja seguro para qualquer input.
 */
export function supabaseImgUrl(
  originalUrl: string,
  width = 800,
  quality = 80
): string {
  if (!originalUrl.includes('/storage/v1/object/public/')) {
    return originalUrl;
  }
  return (
    originalUrl.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    ) + `?width=${width}&quality=${quality}&format=webp`
  );
}
