/** Sanitasi input pencarian client-side (bukan query SQL). */
export function sanitizeSearchQuery(raw: string, maxLen = 64): string {
  return raw
    .slice(0, maxLen)
    .replace(/[\0\r\n\t%_*\\]/g, "")
    .trim();
}

export function matchesContainsSearch(haystack: string, query: string): boolean {
  const q = sanitizeSearchQuery(query).toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}
