import { ApiError } from "@/shared/api";

import { aiJobStore, MOCK_AI_DELAY_MS } from "./mock/register-mock-api";
import {
  checkPurchaseUrl,
  fetchIntroGeneration,
  startIntroGeneration,
  uploadCampaignFile,
} from "./register-api";

beforeEach(() => {
  window.sessionStorage.clear();
  aiJobStore.reset();
  URL.createObjectURL = vi.fn(() => "blob:uploaded");
});

async function errorOf(promise: Promise<unknown>) {
  const error = await promise.then(
    () => undefined,
    (thrown: unknown) => thrown,
  );
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

function file(name: string, type: string, size = 10) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("파일 업로드(A-8)", () => {
  it("JPG를 올리면 id와 미리보기 주소를 받는다", async () => {
    const uploaded = await uploadCampaignFile(
      file("main.jpg", "image/jpeg"),
      "INTRO_MAIN_IMAGE",
    );

    expect(uploaded).toMatchObject({
      url: "blob:uploaded",
      mediaType: "IMAGE",
      durationSec: null,
    });
    expect(uploaded.fileId).toBeTruthy();
  });

  it("JPG·PNG가 아닌 이미지는 400 INVALID_FILE_TYPE이다", async () => {
    const error = await errorOf(
      uploadCampaignFile(file("a.gif", "image/gif"), "INTRO_MEDIA"),
    );

    expect(error).toMatchObject({
      status: 400,
      data: { reason: "INVALID_FILE_TYPE" },
    });
  });

  it("10MB를 넘는 이미지는 400 FILE_TOO_LARGE이다", async () => {
    const error = await errorOf(
      uploadCampaignFile(
        file("big.png", "image/png", 10 * 1024 * 1024 + 1),
        "INTRO_MAIN_IMAGE",
      ),
    );

    expect(error).toMatchObject({ data: { reason: "FILE_TOO_LARGE" } });
  });

  it("동영상은 상세 이미지/동영상에만 올릴 수 있다", async () => {
    const video = file("clip.mp4", "video/mp4");

    const uploaded = await uploadCampaignFile(video, "INTRO_MEDIA");
    const error = await errorOf(uploadCampaignFile(video, "INTRO_MAIN_IMAGE"));

    expect(uploaded.mediaType).toBe("VIDEO");
    expect(error.data).toMatchObject({ reason: "INVALID_FILE_TYPE" });
  });
});

describe("구매처 URL 확인(A-9)", () => {
  it("http(s) 주소는 유효하다", async () => {
    expect(await checkPurchaseUrl(" https://shop.example.com/p/1 ")).toEqual({
      valid: true,
      normalizedUrl: "https://shop.example.com/p/1",
    });
  });

  it("주소 형식이 아니면 오류가 아니라 valid: false다", async () => {
    expect(await checkPurchaseUrl("shop.example.com")).toEqual({
      valid: false,
      normalizedUrl: null,
    });
    expect(await checkPurchaseUrl("ftp://shop.example.com")).toMatchObject({
      valid: false,
    });
  });
});

describe("AI 생성(A-10)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-06T10:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("시작하면 작업 id를 받고 3초가 지나기 전에는 생성 중이다", async () => {
    const { jobId } = await startIntroGeneration(1001, "https://shop/p/1");

    vi.advanceTimersByTime(MOCK_AI_DELAY_MS - 1);

    expect(await fetchIntroGeneration(1001, jobId)).toEqual({
      status: "PENDING",
      result: null,
      failReason: null,
    });
  });

  it("3초가 지나면 소개서 칸에 채울 결과를 준다", async () => {
    const { jobId } = await startIntroGeneration(1001, "https://shop/p/1");

    vi.advanceTimersByTime(MOCK_AI_DELAY_MS);
    const done = await fetchIntroGeneration(1001, jobId);

    expect(done.status).toBe("DONE");
    expect(done.result?.mainImage.mediaType).toBe("IMAGE");
    expect(done.result?.media.length).toBeGreaterThan(0);
    expect(done.result?.hashtags.length).toBeGreaterThan(0);
  });

  it("URL에 fail이 들어 있으면 실패로 끝난다", async () => {
    const { jobId } = await startIntroGeneration(1001, "https://fail.example");

    vi.advanceTimersByTime(MOCK_AI_DELAY_MS);

    expect(await fetchIntroGeneration(1001, jobId)).toMatchObject({
      status: "FAILED",
      result: null,
      failReason: "GENERATION_FAILED",
    });
  });

  it("생성 중에 다시 시작하면 409와 함께 진행 중인 작업 id를 준다", async () => {
    const { jobId } = await startIntroGeneration(1001, "https://shop/p/1");

    const error = await errorOf(startIntroGeneration(1001, "https://shop/p/2"));

    expect(error).toMatchObject({
      status: 409,
      data: { reason: "GENERATION_IN_PROGRESS", jobId },
    });
  });

  it("끝난 뒤에는 다시 생성할 수 있고, 다른 캠페인의 작업은 조회할 수 없다", async () => {
    const { jobId } = await startIntroGeneration(1001, "https://shop/p/1");
    vi.advanceTimersByTime(MOCK_AI_DELAY_MS);

    await expect(
      startIntroGeneration(1001, "https://shop/p/1"),
    ).resolves.toHaveProperty("jobId");
    expect(await errorOf(fetchIntroGeneration(2002, jobId))).toMatchObject({
      status: 404,
      data: { reason: "JOB_NOT_FOUND" },
    });
  });
});

describe("개발 서버가 아닌 빌드", () => {
  beforeEach(() => vi.stubEnv("DEV", false));
  afterEach(() => vi.unstubAllEnvs());

  it("API가 없어서 목으로 응답하지 않고 던진다", async () => {
    await expect(checkPurchaseUrl("https://a.example")).rejects.toThrow(
      "not available",
    );
  });
});
