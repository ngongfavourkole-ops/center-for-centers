import { normalizeText } from './regions';

// True when every word of the query appears somewhere in the given fields.
// Case and accents are ignored, so "yaounde" matches "Yaoundé".
export function matchesQuery(query: string, fields: Array<string | undefined | null>): boolean {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeText(fields.filter(Boolean).join(' '));
  return words.every(word => haystack.includes(word));
}
