/**
 * Shared sitemap utilities for stable XML generation.
 * - XML escaping to prevent invalid XML from special chars in URLs
 * - Safe fallbacks for error handling
 */

export function escapeXml(unsafe: string): string {
  return String(unsafe ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Format date to UTC Z for sitemap lastmod */
export function toUtcLastmod(d?: Date | string | null): string {
  if (!d) return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}
