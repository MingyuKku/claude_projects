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
});
