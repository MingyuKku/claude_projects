import { act, renderHook } from "@testing-library/react";

import { useInquiryUploadStore } from "@/entities/inquiry";
import { ApiError, serverApiV3 } from "@/shared/api";

import { useRegisterBigbirdInquiry } from "./useRegisterBigbirdInquiry";

import type { InquiryCampaignViewModel } from "@/entities/inquiry";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
  };
});

const campaign: InquiryCampaignViewModel = {
  campaignIdx: 10,
  campaignCode: "P-1",
  brandName: "빅버드",
  productName: "샘플 상품",
  name: "[빅버드]샘플 상품",
  imageUrl: null,
  period: null,
};

const created = { result: true, data: { sequence: 1, threadIdx: 101 } };
const sent = { result: true, threadIdx: 101 };

function postedPaths() {
  return vi
    .mocked(serverApiV3.post)
    .mock.calls.map(([path, body]) =>
      path === "/help/thread"
        ? "create"
        : (body as { isAuto: boolean }).isAuto
          ? "card"
          : "body",
    );
}

beforeEach(() => {
  vi.mocked(serverApiV3.post).mockReset();
});

it("캠페인 문의는 생성 → 캠페인 카드 → 본문 순서로 보낸다", async () => {
  vi.mocked(serverApiV3.post)
    .mockResolvedValueOnce(created)
    .mockResolvedValue(sent);
  const { result } = renderHook(() => useRegisterBigbirdInquiry());
  let outcome: unknown;
  await act(async () => {
    outcome = await result.current.register(campaign, "문의합니다");
  });
  expect(outcome).toEqual({ status: "registered", threadIdx: 101 });
  expect(postedPaths()).toEqual(["create", "card", "body"]);
});

it("기타 문의는 자동 메시지 없이 본문만 보낸다", async () => {
  vi.mocked(serverApiV3.post)
    .mockResolvedValueOnce(created)
    .mockResolvedValue(sent);
  const { result } = renderHook(() => useRegisterBigbirdInquiry());
  await act(async () => {
    await result.current.register(null, "문의합니다");
  });
  expect(postedPaths()).toEqual(["create", "body"]);
});

it("본문 전송이 실패한 뒤 다시 제출하면 문의를 또 만들지 않는다", async () => {
  vi.mocked(serverApiV3.post)
    .mockResolvedValueOnce(created)
    .mockResolvedValueOnce(sent)
    .mockRejectedValueOnce(new ApiError(500, undefined))
    .mockResolvedValue(sent);
  const { result } = renderHook(() => useRegisterBigbirdInquiry());
  let first: unknown;
  let second: unknown;
  await act(async () => {
    first = await result.current.register(campaign, "문의합니다");
  });
  await act(async () => {
    second = await result.current.register(campaign, "문의합니다");
  });
  expect(first).toEqual({ status: "messageFailed" });
  expect(second).toEqual({ status: "registered", threadIdx: 101 });
  // 두 번째 제출은 생성·캠페인 카드를 건너뛰고 본문만 다시 보냄.
  expect(postedPaths()).toEqual(["create", "card", "body", "body"]);
});

it("생성이 실패하면 메시지를 보내지 않는다", async () => {
  vi.mocked(serverApiV3.post).mockRejectedValueOnce(
    new ApiError(500, undefined),
  );
  const { result } = renderHook(() => useRegisterBigbirdInquiry());
  let outcome: unknown;
  await act(async () => {
    outcome = await result.current.register(campaign, "문의합니다");
  });
  expect(outcome).toEqual({ status: "createFailed" });
  expect(postedPaths()).toEqual(["create"]);
});

it("등록에 성공한 뒤 다시 제출하면 새 문의를 만든다", async () => {
  vi.mocked(serverApiV3.post)
    .mockResolvedValueOnce(created)
    .mockResolvedValueOnce(sent)
    .mockResolvedValueOnce({
      result: true,
      data: { sequence: 2, threadIdx: 102 },
    })
    .mockResolvedValue({ result: true, threadIdx: 102 });
  const { result } = renderHook(() => useRegisterBigbirdInquiry());
  await act(async () => {
    await result.current.register(null, "첫 문의");
  });
  let outcome: unknown;
  await act(async () => {
    outcome = await result.current.register(null, "두 번째 문의");
  });
  expect(outcome).toEqual({ status: "registered", threadIdx: 102 });
  expect(postedPaths()).toEqual(["create", "body", "create", "body"]);
});

describe("첨부", () => {
  const files = [new File(["1"], "1.png"), new File(["2"], "2.png")];
  const upload = (n: number) => ({
    result: true,
    url: `https://cdn/${n}.png`,
    attachmentIdx: n,
    fileName: `${n}.png`,
    fileSize: 1,
  });

  // 경로별로 응답하고, 첫 업로드만 gate를 열 때까지 붙잡아 "기다리지 않음"을 확인함.
  function mockServer() {
    let open!: () => void;
    const gate = new Promise<void>((resolve) => (open = resolve));
    let uploads = 0;
    vi.mocked(serverApiV3.post).mockImplementation(async (path: string) => {
      if (path === "/help/thread") return created;
      if (path === "/help/thread/message") return sent;
      uploads += 1;
      if (uploads === 1) await gate;
      return upload(uploads);
    });
    return open;
  }

  it("본문까지 보내면 첨부를 기다리지 않고 등록을 끝내고, 업로드는 백그라운드 작업으로 넘긴다", async () => {
    const open = mockServer();
    const { result } = renderHook(() => useRegisterBigbirdInquiry());
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.register(null, "본문", files);
    });
    // 첫 업로드가 아직 끝나지 않았는데도 등록은 끝났다.
    expect(outcome).toEqual({ status: "registered", threadIdx: 101 });
    expect(useInquiryUploadStore.getState().jobs[101]).toMatchObject({
      files,
      sentCount: 0,
      status: "uploading",
    });
    open();
    await vi.waitFor(() =>
      expect(useInquiryUploadStore.getState().jobs).toEqual({}),
    );
  });

  it("본문이 비어 있으면 본문은 보내지 않고 문의만 만든 뒤 첨부를 넘긴다", async () => {
    const open = mockServer();
    const { result } = renderHook(() => useRegisterBigbirdInquiry());
    await act(async () => {
      await result.current.register(null, "", files);
    });
    open();
    await vi.waitFor(() =>
      expect(useInquiryUploadStore.getState().jobs).toEqual({}),
    );
    const paths = vi.mocked(serverApiV3.post).mock.calls.map(([path]) => path);
    expect(paths).toEqual([
      "/help/thread",
      "/help/message/image/help",
      "/help/thread/message",
      "/help/message/image/help",
      "/help/thread/message",
    ]);
  });

  it("첨부가 없으면 업로드 작업을 만들지 않는다", async () => {
    mockServer();
    const { result } = renderHook(() => useRegisterBigbirdInquiry());
    await act(async () => {
      await result.current.register(null, "본문");
    });
    expect(useInquiryUploadStore.getState().jobs).toEqual({});
  });
});
