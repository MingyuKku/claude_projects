import { beforeEach, describe, expect, it, vi } from "vitest";

import { serverApiV3 } from "@/shared/api";

import { toFolderDrafts } from "../model/folder-draft";
import { saveFolderDrafts } from "./save-folder-drafts";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  serverApiV3: { get: vi.fn(), put: vi.fn() },
}));

const ALL = { folderIdx: null, name: "전체", count: 1, avatarUrls: [] };
const BEAUTY = { folderIdx: 1, name: "뷰티", count: 1, avatarUrls: [] };
const ADDED = { folderIdx: 2, name: "다른 탭", count: 1, avatarUrls: [] };
const ORIGINAL = toFolderDrafts([ALL, BEAUTY]);

describe("saveFolderDrafts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(serverApiV3.put).mockResolvedValue([]);
  });

  it("목록을 다시 읽지 못하면 저장하지 않는다", async () => {
    vi.mocked(serverApiV3.get).mockRejectedValue(new Error("network"));
    await expect(saveFolderDrafts(ORIGINAL, [])).rejects.toThrow("network");
    expect(serverApiV3.put).not.toHaveBeenCalled();
  });

  it("고치는 동안 다른 곳에서 생긴 폴더를 함께 보낸다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue([ALL, BEAUTY, ADDED]);
    await saveFolderDrafts(ORIGINAL, []);
    expect(serverApiV3.put).toHaveBeenCalledWith(
      "/matching/bookmark/folder/sync",
      { folders: [{ folderIdx: 2, name: "다른 탭" }] },
    );
  });
});
