/** 서버가 쉼표로 구분해 저장하는 곳이 있어(캠페인 등록 A-5.6) 항목 안에는 쉼표를 둘 수 없음. */
export function stripKeywordComma(input: string) {
  return input.replace(/[,，]/g, "");
}

/** 앞뒤 공백과 "#"을 떼고 더함(항목 안 공백은 허용). 빈 값이나 이미 있는 값이면 그대로 둠. */
export function addKeyword(keywords: string[], input: string) {
  const keyword = stripKeywordComma(input).trim().replace(/^#+/, "").trim();
  if (!keyword || keywords.includes(keyword)) return keywords;
  return [...keywords, keyword];
}
