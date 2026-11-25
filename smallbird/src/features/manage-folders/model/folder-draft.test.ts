import { describe, expect, it } from "vitest";

import { hasDraftChanges, toFolderDrafts, toSyncFolders } from "./folder-draft";

const ORIGINAL = toFolderDrafts([
  { folderIdx: null, name: "전체", count: 9, avatarUrls: [] },
  { folderIdx: 1, name: "뷰티", count: 3, avatarUrls: [] },
  { folderIdx: 2, name: "가전", count: 4, avatarUrls: [] },
]);
const [BEAUTY, HOME] = ORIGINAL;
const TRAVEL = { id: "new-0", folderIdx: null, name: "여행", count: 0 };

describe("hasDraftChanges", () => {
  it("바꾼 것이 없거나 되돌리면 변경 없음", () => {
    expect(hasDraftChanges(ORIGINAL, [...ORIGINAL])).toBe(false);
    expect(
      hasDraftChanges(ORIGINAL, [{ ...BEAUTY!, name: "뷰티" }, HOME!]),
    ).toBe(false);
  });

  it("이름·순서·삭제·추가를 변경으로 본다", () => {
    expect(
      hasDraftChanges(ORIGINAL, [{ ...BEAUTY!, name: "색조" }, HOME!]),
    ).toBe(true);
    expect(hasDraftChanges(ORIGINAL, [HOME!, BEAUTY!])).toBe(true);
    expect(hasDraftChanges(ORIGINAL, [HOME!])).toBe(true);
    expect(hasDraftChanges(ORIGINAL, [])).toBe(true);
    expect(hasDraftChanges(ORIGINAL, [...ORIGINAL, TRAVEL])).toBe(true);
  });
});

describe("toSyncFolders", () => {
  it("화면 순서대로 보내고 새 폴더는 folderIdx가 null", () => {
    expect(toSyncFolders(ORIGINAL, [HOME!, TRAVEL], ORIGINAL)).toEqual([
      { folderIdx: 2, name: "가전" },
      { folderIdx: null, name: "여행" },
    ]);
  });

  it("다른 곳에서 생긴 폴더는 지우지 않고 맨 뒤에 남긴다", () => {
    const added = { id: "3", folderIdx: 3, name: "다른 탭", count: 1 };
    expect(toSyncFolders(ORIGINAL, [], [...ORIGINAL, added])).toEqual([
      { folderIdx: 3, name: "다른 탭" },
    ]);
  });

  it("내가 바꾸지 않은 이름은 최신 이름을 쓴다", () => {
    const latest = ORIGINAL.map((item) => ({ ...item, name: "바뀐 이름" }));
    expect(
      toSyncFolders(ORIGINAL, [{ ...BEAUTY!, name: "색조" }, HOME!], latest),
    ).toEqual([
      { folderIdx: 1, name: "색조" },
      { folderIdx: 2, name: "바뀐 이름" },
    ]);
  });
});
