export interface SearchMatchOptions {
  exactMatch?: boolean;
  caseSensitive?: boolean;
}

function isSegmentBoundary(char: string): boolean {
  if (!char) {
    return true;
  }
  return !/[\p{L}\p{N}\u4e00-\u9fff]/u.test(char);
}

function containsExactSegment(
  text: string,
  keyword: string,
  caseSensitive: boolean
): boolean {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) {
    return false;
  }
  const haystack = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive
    ? trimmedKeyword
    : trimmedKeyword.toLowerCase();
  let startIndex = 0;

  while (startIndex <= haystack.length - needle.length) {
    const index = haystack.indexOf(needle, startIndex);
    if (index === -1) {
      return false;
    }
    const before = index > 0 ? haystack[index - 1] : "";
    const after =
      index + needle.length < haystack.length
        ? haystack[index + needle.length]
        : "";
    if (isSegmentBoundary(before) && isSegmentBoundary(after)) {
      return true;
    }
    startIndex = index + 1;
  }
  return false;
}

export function textMatches(
  text: string,
  keyword: string,
  options: SearchMatchOptions = {}
): boolean {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) {
    return false;
  }
  const rawText = text || "";

  if (!options.exactMatch) {
    const haystack = options.caseSensitive ? rawText : rawText.toLowerCase();
    const needle = options.caseSensitive
      ? trimmedKeyword
      : trimmedKeyword.toLowerCase();
    return haystack.includes(needle);
  }

  const textCmp = options.caseSensitive
    ? rawText.trim()
    : rawText.trim().toLowerCase();
  const keywordCmp = options.caseSensitive
    ? trimmedKeyword
    : trimmedKeyword.toLowerCase();
  if (textCmp === keywordCmp) {
    return true;
  }
  return containsExactSegment(rawText, trimmedKeyword, !!options.caseSensitive);
}

export function fieldsMatch(
  fields: string[],
  keyword: string,
  options: SearchMatchOptions = {}
): boolean {
  return fields.some((field) => textMatches(field || "", keyword, options));
}

export function buildFieldMatchSql(
  fields: string[],
  keyword: string,
  options: SearchMatchOptions = {}
): { condition: string; data: string[] } {
  const trimmedKeyword = keyword.trim();
  const caseSensitive = !!options.caseSensitive;

  const fieldConditions = fields.map((field) => {
    if (caseSensitive) {
      return `instr(${field}, ?) > 0`;
    }
    return `lower(${field}) LIKE ?`;
  });

  const data = fields.map(() =>
    caseSensitive ? trimmedKeyword : `%${trimmedKeyword.toLowerCase()}%`
  );

  return {
    condition: fieldConditions.join(" OR "),
    data,
  };
}
