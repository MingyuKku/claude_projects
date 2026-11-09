import { ApiError } from "@/shared/api";
import samplePost from "@/shared/assets/img/sns/sample-post.jpg";
import { createMockStore, registerMockFile } from "@/shared/lib";

import type { FileUploadKind } from "../../model/schema";

// 파일 업로드(A-8)·구매처 URL 확인(A-9)·AI 생성(A-10)의 목. 요구 명세의 오류 규칙(HTTP 상태 + `reason`)을 따름.

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png"];
const VIDEO_METADATA_TIMEOUT_MS = 1000;
/** 목의 AI 생성 지연(스펙: 3초). 실제는 최대 5분이 걸릴 수 있음. */
export const MOCK_AI_DELAY_MS = 3000;

function fail(status: number, reason: string, extra?: object): never {
  throw new ApiError(status, { result: false, reason, ...extra });
}

/** 동영상 길이(초). 메타데이터를 읽지 못하면 null. */
function readVideoDuration(file: Blob) {
  return new Promise<number | null>((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const finish = (duration: number | null) => {
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      finish(
        Number.isFinite(video.duration) ? Math.round(video.duration) : null,
      );
    video.onerror = () => finish(null);
    // 메타데이터를 못 읽는 환경(테스트 등)에서 업로드가 멈추지 않게 함.
    setTimeout(() => finish(null), VIDEO_METADATA_TIMEOUT_MS);
    video.src = url;
  });
}

/** A-8 파일 업로드. 이미지는 JPG·PNG 10MB 이하(동영상 규칙은 정해지지 않아 형식만 봄, P-12). */
export async function uploadFile(file: File, kind: FileUploadKind) {
  const isVideo = file.type.startsWith("video/");
  if (isVideo && kind !== "INTRO_MEDIA") fail(400, "INVALID_FILE_TYPE");
  if (!isVideo) {
    if (!IMAGE_TYPES.includes(file.type)) fail(400, "INVALID_FILE_TYPE");
    if (file.size > MAX_IMAGE_BYTES) fail(400, "FILE_TOO_LARGE");
  }
  const { fileId, url } = registerMockFile(file);
  return {
    fileId,
    url,
    mediaType: isVideo ? "VIDEO" : "IMAGE",
    durationSec: isVideo ? await readVideoDuration(file) : null,
    thumbnailUrl: null,
  };
}

/** A-9 구매처 URL 확인. 목은 `http(s)://` 형식만 봄(실제는 열리는지 등을 서버가 정함, Q-6). */
export async function checkPurchaseUrl(url: string) {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    const isWeb = parsed.protocol === "http:" || parsed.protocol === "https:";
    return { valid: isWeb, normalizedUrl: isWeb ? trimmed : null };
  } catch {
    return { valid: false, normalizedUrl: null };
  }
}

interface AiJob {
  campaignIdx: number;
  sourceUrl: string;
  startedAt: number;
}

// 새로고침해도 작업을 이어서 기다릴 수 있게 sessionStorage에도 둠.
export const aiJobStore = createMockStore<{
  nextJobSeq: number;
  jobs: Record<string, AiJob>;
}>("bigbird:mock:ai-jobs", () => ({ nextJobSeq: 1, jobs: {} }));

function isPending(job: AiJob) {
  return Date.now() - job.startedAt < MOCK_AI_DELAY_MS;
}

/** A-10 AI 생성 시작(202). 이미 생성 중이면 409와 함께 그 작업 id를 줌. */
export async function startIntroGeneration(
  campaignIdx: number,
  sourceUrl: string,
) {
  const running = Object.entries(aiJobStore.get().jobs).find(
    ([, job]) => job.campaignIdx === campaignIdx && isPending(job),
  );
  if (running) fail(409, "GENERATION_IN_PROGRESS", { jobId: running[0] });

  let jobId = "";
  aiJobStore.update((db) => {
    jobId = `job-${db.nextJobSeq}`;
    db.nextJobSeq += 1;
    db.jobs[jobId] = { campaignIdx, sourceUrl, startedAt: Date.now() };
  });
  return { jobId };
}

/** A-10 AI 생성 결과 조회. 목은 3초 뒤 끝나고, URL에 "fail"이 들어 있으면 실패로 끝남. */
export async function getIntroGeneration(campaignIdx: number, jobId: string) {
  const job = aiJobStore.get().jobs[jobId];
  if (job?.campaignIdx !== campaignIdx) fail(404, "JOB_NOT_FOUND");
  if (isPending(job)) {
    return { status: "PENDING", result: null, failReason: null };
  }
  if (job.sourceUrl.includes("fail")) {
    return { status: "FAILED", result: null, failReason: "GENERATION_FAILED" };
  }
  const image = (fileId: string) => ({
    fileId,
    url: samplePost,
    mediaType: "IMAGE",
    durationSec: null,
    thumbnailUrl: null,
  });
  return {
    status: "DONE",
    result: {
      mainImage: image(`${jobId}-main`),
      media: [image(`${jobId}-media-1`), image(`${jobId}-media-2`)],
      description: `${job.sourceUrl} 페이지를 바탕으로 AI가 작성한 캠페인 설명입니다.`,
      notice: "AI가 작성한 유의사항입니다. 내용을 확인하고 고쳐 주세요.",
      hashtags: ["신제품", "체험단", "리뷰"],
    },
    failReason: null,
  };
}
