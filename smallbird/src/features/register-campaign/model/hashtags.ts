/** 앞뒤 공백과 "#"을 떼고 더함. 빈 값이나 같은 칸에 이미 있는 값이면 그대로 둠. */
export function addHashtag(hashtags: string[], input: string) {
  const keyword = input.trim().replace(/^#+/, "").trim();
  if (!keyword || hashtags.includes(keyword)) return hashtags;
  return [...hashtags, keyword];
}
