/** 서버가 쉼표로 구분해 저장하므로 항목 안에는 쉼표를 둘 수 없음(A-5.6). */
export function stripHashtagComma(input: string) {
  return input.replace(/[,，]/g, "");
}

/** 앞뒤 공백과 "#"을 떼고 더함(항목 안 공백은 허용). 빈 값이나 같은 칸에 이미 있는 값이면 그대로 둠. */
export function addHashtag(hashtags: string[], input: string) {
  const keyword = stripHashtagComma(input).trim().replace(/^#+/, "").trim();
  if (!keyword || hashtags.includes(keyword)) return hashtags;
  return [...hashtags, keyword];
}
