import { mutate } from "swr";

import {
  sendInquiryMessage,
  uploadInquiryAttachment,
} from "../api/inquiry-api";
import {
  retryInquiryUploads,
  startInquiryUploads,
  useInquiryUploadStore,
} from "./upload-jobs";

vi.mock("../api/inquiry-api", () => ({
  uploadInquiryAttachment: vi.fn(),
  sendInquiryMessage: vi.fn(),
}));
vi.mock("swr", () => ({ mutate: vi.fn() }));

const file = (name: string) => new File(["x"], name);
const jobs = () => useInquiryUploadStore.getState().jobs;

beforeEach(() => {
  vi.clearAllMocks();
  useInquiryUploadStore.setState({ jobs: {} });
  vi.mocked(uploadInquiryAttachment).mockImplementation(async (f) => ({
    url: `https://cdn/${f.name}`,
    attachmentIdx: 1,
    fileName: f.name,
    fileSize: 1,
  }));
  vi.mocked(sendInquiryMessage).mockResolvedValue(101);
});

describe("업로드 작업", () => {
  it("파일을 순서대로 올려 메시지로 보내고, 끝나면 작업을 지우고 대화 목록을 한 번만 갱신한다", async () => {
    startInquiryUploads(101, [file("a.png"), file("b.png")]);
    expect(jobs()[101]).toMatchObject({ sentCount: 0, status: "uploading" });
    await vi.waitFor(() => expect(jobs()).toEqual({}));
    expect(
      vi.mocked(sendInquiryMessage).mock.calls.map(([arg]) => arg.body),
    ).toEqual(["https://cdn/a.png", "https://cdn/b.png"]);
    expect(mutate).toHaveBeenCalledOnce();
  });

  it("중간에 실패하면 멈춰서 실패로 표시하고, 다시 시도하면 실패한 파일부터 이어 보낸다", async () => {
    vi.mocked(uploadInquiryAttachment).mockImplementationOnce(async (f) => ({
      url: `https://cdn/${f.name}`,
      attachmentIdx: 1,
      fileName: f.name,
      fileSize: 1,
    }));
    vi.mocked(uploadInquiryAttachment).mockRejectedValueOnce(new Error("500"));
    startInquiryUploads(101, [file("a.png"), file("b.png"), file("c.png")]);
    await vi.waitFor(() =>
      expect(jobs()[101]).toMatchObject({ sentCount: 1, status: "failed" }),
    );
    // 실패해도 이미 보낸 것은 대화에 보이도록 갱신한다.
    expect(mutate).toHaveBeenCalledOnce();

    retryInquiryUploads(101);
    await vi.waitFor(() => expect(jobs()).toEqual({}));
    expect(
      vi.mocked(sendInquiryMessage).mock.calls.map(([arg]) => arg.body),
    ).toEqual(["https://cdn/a.png", "https://cdn/b.png", "https://cdn/c.png"]);
  });

  it("끝난 문의라 서버가 새 스레드로 받았으면 다시 시도할 때도 그 스레드로 이어 보낸다", async () => {
    vi.mocked(sendInquiryMessage).mockResolvedValue(202);
    vi.mocked(uploadInquiryAttachment)
      .mockImplementationOnce(async (f) => ({
        url: `https://cdn/${f.name}`,
        attachmentIdx: 1,
        fileName: f.name,
        fileSize: 1,
      }))
      .mockRejectedValueOnce(new Error("500"));
    startInquiryUploads(101, [file("a.png"), file("b.png")]);
    await vi.waitFor(() =>
      expect(jobs()[101]).toMatchObject({ status: "failed" }),
    );

    retryInquiryUploads(101);
    await vi.waitFor(() => expect(jobs()).toEqual({}));
    expect(
      vi.mocked(sendInquiryMessage).mock.calls.map(([arg]) => arg.threadIdx),
    ).toEqual([101, 202]);
  });

  it("첨부를 보낸 뒤 캠페인 타임라인도 다시 받는다", async () => {
    startInquiryUploads(101, [file("a.png")]);
    await vi.waitFor(() => expect(jobs()).toEqual({}));
    const [matcher] = vi.mocked(mutate).mock.calls[0] as unknown as [
      (key: unknown) => boolean,
    ];
    expect(matcher(["campaign-timeline", 6329])).toBe(true);
  });

  it("같은 문의에서는 업로드가 겹쳐 돌지 않는다", async () => {
    let release!: () => void;
    vi.mocked(uploadInquiryAttachment).mockImplementationOnce(
      (f) =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              url: "u",
              attachmentIdx: 1,
              fileName: f.name,
              fileSize: 1,
            });
        }),
    );
    startInquiryUploads(101, [file("a.png")]);
    retryInquiryUploads(101);
    release();
    await vi.waitFor(() => expect(jobs()).toEqual({}));
    expect(uploadInquiryAttachment).toHaveBeenCalledOnce();
  });

  it("파일이 없으면 작업을 만들지 않는다", () => {
    startInquiryUploads(101, []);
    expect(jobs()).toEqual({});
  });
  describe("같은 문의에 연달아 보낸 첨부", () => {
    const sentBodies = () =>
      vi.mocked(sendInquiryMessage).mock.calls.map(([arg]) => arg.body);

    // 업로드가 release 하기 전까지 멈추는 가짜 서버. 올리는 도중 다음 첨부를 보내는 상황을 만듦.
    function holdUploads() {
      const waiting: Array<() => void> = [];
      vi.mocked(uploadInquiryAttachment).mockImplementation(
        (f) =>
          new Promise((resolve) =>
            waiting.push(() =>
              resolve({
                url: `https://cdn/${f.name}`,
                attachmentIdx: 1,
                fileName: f.name,
                fileSize: 1,
              }),
            ),
          ),
      );
      return {
        async releaseNext() {
          await vi.waitFor(() => expect(waiting.length).toBeGreaterThan(0));
          waiting.shift()?.();
        },
      };
    }

    it("A(3개)를 올리는 중에 B(2개)를 보내면 5개 모두 순서대로 보낸다", async () => {
      const server = holdUploads();
      startInquiryUploads(101, [file("a1"), file("a2"), file("a3")]);
      await server.releaseNext(); // a1 전송
      await vi.waitFor(() => expect(sendInquiryMessage).toHaveBeenCalledOnce());
      startInquiryUploads(101, [file("b1"), file("b2")]); // a2를 올리는 중
      for (let i = 0; i < 4; i++) await server.releaseNext();
      await vi.waitFor(() => expect(jobs()).toEqual({}));
      expect(sentBodies()).toEqual(
        ["a1", "a2", "a3", "b1", "b2"].map((name) => `https://cdn/${name}`),
      );
    });

    it("A(1개)를 올리는 중에 B(1개)를 보내도 둘 다 보낸다", async () => {
      const server = holdUploads();
      startInquiryUploads(101, [file("a1")]);
      startInquiryUploads(101, [file("b1")]);
      await server.releaseNext();
      await server.releaseNext();
      await vi.waitFor(() => expect(jobs()).toEqual({}));
      expect(sentBodies()).toEqual(["https://cdn/a1", "https://cdn/b1"]);
      expect(uploadInquiryAttachment).toHaveBeenCalledTimes(2);
    });

    it("A가 끝난 뒤에 B를 보내면 따로 보내고 같은 파일을 다시 올리지 않는다", async () => {
      startInquiryUploads(101, [file("a1")]);
      await vi.waitFor(() => expect(jobs()).toEqual({}));
      startInquiryUploads(101, [file("b1")]);
      await vi.waitFor(() => expect(jobs()).toEqual({}));
      expect(sentBodies()).toEqual(["https://cdn/a1", "https://cdn/b1"]);
    });

    it("다른 문의의 업로드는 서로 독립이다", async () => {
      const server = holdUploads();
      startInquiryUploads(101, [file("a1")]);
      startInquiryUploads(202, [file("c1")]);
      // 두 문의의 업로드가 함께 시작됨(한쪽이 끝나길 기다리지 않음)
      await vi.waitFor(() =>
        expect(uploadInquiryAttachment).toHaveBeenCalledTimes(2),
      );
      await server.releaseNext();
      await server.releaseNext();
      await vi.waitFor(() => expect(jobs()).toEqual({}));
      expect(
        vi
          .mocked(sendInquiryMessage)
          .mock.calls.map(([arg]) => [arg.threadIdx, arg.body]),
      ).toEqual(
        expect.arrayContaining([
          [101, "https://cdn/a1"],
          [202, "https://cdn/c1"],
        ]),
      );
    });

    it("계속 실패하는 파일 때문에 멈춘 문의에 새로 보내도 새 첨부는 나간다", async () => {
      vi.mocked(uploadInquiryAttachment).mockImplementation(async (f) => {
        if (f.name === "a2") throw new Error("500");
        return {
          url: `https://cdn/${f.name}`,
          attachmentIdx: 1,
          fileName: f.name,
          fileSize: 1,
        };
      });
      startInquiryUploads(101, [file("a1"), file("a2")]);
      await vi.waitFor(() =>
        expect(jobs()[101]).toMatchObject({ sentCount: 1, status: "failed" }),
      );
      startInquiryUploads(101, [file("b1")]);
      await vi.waitFor(() => expect(jobs()).toEqual({}));
      // 멈춘 작업에 덧붙이지 않고 새로 시작하므로 a1은 다시 올리지 않고, 실패하던 a2 뒤에 막히지 않은 b1이 나감
      expect(sentBodies()).toEqual(
        ["a1", "b1"].map((name) => `https://cdn/${name}`),
      );
      expect(uploadInquiryAttachment).toHaveBeenCalledTimes(3);
    });
  });
});
