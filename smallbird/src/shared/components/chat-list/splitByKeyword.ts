export interface TextSegment {
  text: string;
  isMatch: boolean;
}

// 검색어 하이라이트용. HTML 문자열을 만들지 않고 조각 배열을 돌려줘 React가 텍스트로만 렌더링하게 함(XSS 방지).
// toLowerCase 는 글자 수가 달라지는 문자(예: İ)가 있어 변환한 문자열의 인덱스를 원문에 쓸 수 없으므로,
// 원문에서 대소문자를 무시하는 정규식으로 직접 찾음.
export function splitByKeyword(text: string, keyword?: string): TextSegment[] {
  const query = keyword?.trim();
  if (!query) return [{ text, isMatch: false }];

  const pattern = new RegExp(
    query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "giu",
  );
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    if (match[0].length === 0) continue;
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), isMatch: false });
    }
    segments.push({ text: match[0], isMatch: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false });
  }
  return segments;
}
