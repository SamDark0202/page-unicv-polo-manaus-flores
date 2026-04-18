/**
 * Normalizes a string for accent-insensitive, case-insensitive search.
 * Removes diacritical marks (accents) and converts to lowercase.
 *
 * Example: normalize("Gestão") === "gestao"
 */
export function normalizeText(value: string): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
