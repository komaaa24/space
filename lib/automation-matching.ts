function normalize(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("uz-UZ")
    // Uzbek apostrophe variants should not split a word (o'zbek = o‘zbek).
    .replace(/[\u0027\u0060\u2018\u2019\u02BB\u02BC\u02BE\u02BF\u055A\uA78C]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function parseAutomationKeywords(raw: string | null | undefined) {
  return (raw ?? "")
    .split(/[,;|\n]+/g)
    .map(normalize)
    .filter(Boolean);
}

export function matchesAutomationText(
  matchAny: boolean,
  rawKeywords: string | null | undefined,
  exactMatch: boolean,
  text: string,
) {
  if (matchAny) return true;

  const normalizedText = normalize(text);
  if (!normalizedText) return false;

  const keywords = parseAutomationKeywords(rawKeywords);
  if (keywords.length === 0) return false;

  if (exactMatch) return keywords.includes(normalizedText);

  const words = normalizedText.split(" ");
  return keywords.some((keyword) => {
    if (keyword.includes(" ")) {
      return (" " + normalizedText + " ").includes(" " + keyword + " ");
    }

    // Keep the useful "narx" -> "narxi" behavior without making very short
    // keywords such as "ha" match unrelated words such as "hamma".
    return words.some(
      (word) => word === keyword || (keyword.length >= 3 && word.startsWith(keyword)),
    );
  });
}
