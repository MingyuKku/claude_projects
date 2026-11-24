import { serverApiV3 } from "@/shared/api";

import { fetchPostingTopics } from "./posting-topic-api";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn() },
}));

const mockGet = vi.mocked(serverApiV3.get);

describe("fetchPostingTopics", () => {
  it("서버 목록을 순서 그대로 읽는다", async () => {
    mockGet.mockResolvedValue({ list: ["All", "Fashion", "Beauty"] });

    await expect(fetchPostingTopics()).resolves.toEqual([
      "All",
      "Fashion",
      "Beauty",
    ]);
    expect(mockGet).toHaveBeenCalledWith("/campaign/topics");
  });

  it("번역이 없는 새 키는 건너뛴다", async () => {
    mockGet.mockResolvedValue({ list: ["All", "NewTopic", "Beauty"] });

    await expect(fetchPostingTopics()).resolves.toEqual(["All", "Beauty"]);
  });

  it("목록이 비어 있거나 없으면 빈 목록이다", async () => {
    mockGet.mockResolvedValue({});

    await expect(fetchPostingTopics()).resolves.toEqual([]);
  });
});
