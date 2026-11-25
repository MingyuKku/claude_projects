import { formatPostDate, getPostMetrics, splitHashtags } from "./feed";

describe("splitHashtags", () => {
  it("끝의 해시태그만 떼고 문장 중간의 해시태그는 남긴다", () => {
    expect(splitHashtags("오늘 #세럼 후기\n\n#데일리 #뷰티 ")).toEqual({
      text: "오늘 #세럼 후기",
      hashtags: ["#데일리", "#뷰티"],
    });
  });

  it("해시태그만 있거나 없어도 나눈다", () => {
    expect(splitHashtags("#하나#둘")).toEqual({
      text: "",
      hashtags: ["#하나", "#둘"],
    });
    expect(splitHashtags("본문")).toEqual({ text: "본문", hashtags: [] });
  });
});

it("서버가 주지 않은 반응 수는 숨기고 0은 보인다", () => {
  expect(getPostMetrics({ viewCount: null, likeCount: 0 })).toEqual({
    views: undefined,
    likes: "0",
    comments: undefined,
    reposts: undefined,
  });
});

it("게시일을 시안 표기로 보이고 읽을 수 없는 값은 그대로 둔다", () => {
  expect(formatPostDate("2024-05-12T02:16:51")).toBe("2024. 05. 12");
  expect(formatPostDate("어제")).toBe("어제");
});
