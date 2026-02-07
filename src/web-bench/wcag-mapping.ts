/**
 * Convert axe-core WCAG tags to dot-notation WCAG criteria.
 *
 * axe tags rules with patterns like "wcag111" (= 1.1.1) and "wcag1412" (= 1.4.12).
 * The format is: wcag + principle(1 digit) + guideline(1 digit) + criterion(1+ digits).
 * Level tags like "wcag2a" and "wcag21aa" are filtered out by the regex.
 */
export function axeTagToWcagCriterion(tag: string): string | null {
  const match = tag.match(/^wcag(\d)(\d)(\d+)$/);
  if (!match) return null;
  return `${match[1]}.${match[2]}.${match[3]}`;
}

/** Extract all WCAG criteria from an axe violation's tags array. */
export function extractAxeWcagCriteria(tags: string[]): string[] {
  return tags
    .map(axeTagToWcagCriterion)
    .filter((c): c is string => c !== null);
}

/**
 * Overlapping criteria where the same axe rule tags both a base criterion
 * and a stricter (higher conformance level) variant. When both appear from
 * the same rule, keep only the base (lower conformance level) to avoid
 * double-counting.
 *
 * Key = stricter criterion to drop, Value = base criterion that must also be present.
 */
const OVERLAPPING_CRITERIA: Record<string, string> = {
  "2.1.3": "2.1.1", // Keyboard No Exception (AAA) overlaps Keyboard (A)
};

/**
 * Deduplicate criteria produced by a single axe rule.
 * If a rule emits both 2.1.1 and 2.1.3, drop 2.1.3.
 */
export function deduplicateOverlapping(criteria: string[]): string[] {
  return criteria.filter((c) => {
    const base = OVERLAPPING_CRITERIA[c];
    return !base || !criteria.includes(base);
  });
}
