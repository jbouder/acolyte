export interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
}

// Run a regular expression against text and collect every match. Global
// patterns are iterated (guarding against zero-length infinite loops); a
// non-global pattern returns at most the first match. Throws on an invalid
// pattern/flags combination, matching `new RegExp` semantics.
export function findMatches(
  pattern: string,
  flags: string,
  text: string,
): RegexMatch[] {
  const regex = new RegExp(pattern, flags);
  const found: RegexMatch[] = [];

  if (flags.includes('g')) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      found.push({
        match: match[0],
        index: match.index,
        groups: match.slice(1),
      });
      // Prevent infinite loops with zero-length matches.
      if (match[0].length === 0) regex.lastIndex++;
    }
  } else {
    const match = regex.exec(text);
    if (match) {
      found.push({
        match: match[0],
        index: match.index,
        groups: match.slice(1),
      });
    }
  }

  return found;
}
