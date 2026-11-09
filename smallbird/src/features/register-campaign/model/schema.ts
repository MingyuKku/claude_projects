import { z } from "zod";

import { campaignFileSchema } from "@/entities/campaign";

// 캠페인 등록 API 요구 명세 A-9(구매처 URL 확인)·A-10(AI 생성)의 응답 모양. 목도 이 스키마로 검증함.

/** 파일을 올리는 곳. 서버가 용도별 검사(브랜드 이미지·메인 이미지는 이미지만)에 씀. */
export const FILE_UPLOAD_KINDS = [
  "BRAND_IMAGE",
  "INTRO_MAIN_IMAGE",
  "INTRO_MEDIA",
] as const;
export type FileUploadKind = (typeof FILE_UPLOAD_KINDS)[number];

/** A-9 응답. 유효하지 않은 URL은 오류가 아니라 200 + `valid: false`. */
export const purchaseUrlCheckSchema = z.object({
  valid: z.boolean(),
  /** `https://`를 붙이는 등 정리한 주소. 있으면 칸을 이 값으로 바꿈. */
  normalizedUrl: z.string().nullable(),
});
export type PurchaseUrlCheck = z.infer<typeof purchaseUrlCheckSchema>;

/** A-10 `POST …/intro/ai` 응답(202). */
export const introGenerationStartSchema = z.object({ jobId: z.string() });

/** A-10 결과: 5단계 칸에 채우는 값. 사용자가 고칠 수 있음. */
const introGenerationResultSchema = z.object({
  mainImage: campaignFileSchema,
  media: z.array(campaignFileSchema),
  description: z.string(),
  notice: z.string(),
  hashtags: z.array(z.string()),
});
export type IntroGenerationResult = z.infer<typeof introGenerationResultSchema>;

/** A-10 `GET …/intro/ai/{jobId}` 응답. */
export const introGenerationSchema = z.object({
  status: z.enum(["PENDING", "DONE", "FAILED"]),
  result: introGenerationResultSchema.nullable(),
  /** 실패 사유 코드. 화면은 코드와 관계없이 같은 실패 토스트를 보임. */
  failReason: z.string().nullable(),
});
export type IntroGeneration = z.infer<typeof introGenerationSchema>;
