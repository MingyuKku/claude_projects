import { z } from "zod";

// 포스팅 가이드 API 응답(stage Swagger 2.2.4.12, `/v3/campaign/{campaignIdx}/posting-guide`).
// 코드는 모르는 값도 읽도록 문자열로 받고 트랜스포머가 거름. 비어 있는 값은 null·빈 배열로 채움.

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null);
const nullableNumber = z
  .number()
  .int()
  .nullish()
  .transform((value) => value ?? null);
const stringList = z
  .array(z.string())
  .nullish()
  .transform((value) => value ?? []);

const postingGuideTimecodeSchema = z.object({
  idx: z.number().int(),
  timecode: z.string(),
  startTime: nullableString,
  endTime: nullableString,
  description: nullableString,
});

const postingGuideExampleSchema = z.object({
  idx: z.number().int(),
  mediaType: z.string(),
  /** 카드에 붙은 파일(이미지는 1개 이상, 영상은 1개). 주소는 아직 응답에 없음(백엔드 요청 B-20). */
  files: z
    .array(z.object({ idx: z.number().int(), attachmentIdx: nullableNumber }))
    .nullish()
    .transform((value) => value ?? []),
  title: nullableString,
  comment: nullableString,
  timecodes: z
    .array(postingGuideTimecodeSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const postingGuideSchema = z.object({
  idx: z.number().int(),
  creationMethod: nullableString,
  postingCount: nullableNumber,
  minPhotoCount: nullableNumber,
  minVideoCount: nullableNumber,
  photoType: nullableString,
  videoType: nullableString,
  requiredKeywords: stringList,
  requiredHashtags: stringList,
  notice: nullableString,
  referenceUrls: stringList,
  contentGuide: nullableString,
  examples: z
    .array(postingGuideExampleSchema)
    .nullish()
    .transform((value) => value ?? []),
  status: z.string(),
  aiGeneratedAt: nullableString,
  confirmedAt: nullableString,
  needsAttention: z
    .boolean()
    .nullish()
    .transform((value) => value ?? false),
});
export type PostingGuideResponse = z.infer<typeof postingGuideSchema>;

/** 미리보기(`GET …/preview`): 캠페인 정보 + 가이드. 진행 기간은 "yyyy.MM.dd~yyyy.MM.dd". */
export const postingGuidePreviewSchema = z.object({
  campaignName: z.string(),
  campaignType: nullableString,
  progressPeriod: nullableString,
  campaignCode: z.string(),
  brandName: nullableString,
  brandImageUrl: nullableString,
  guide: postingGuideSchema,
});
export type PostingGuidePreviewResponse = z.infer<
  typeof postingGuidePreviewSchema
>;

export const postingGuidePaymentSchema = z.object({
  cost: z.number().int(),
  balance: z.number().int(),
  shortfallAmount: z.number().int(),
  alreadyPaid: z
    .boolean()
    .nullish()
    .transform((value) => value ?? false),
});
export type PostingGuidePaymentResponse = z.infer<
  typeof postingGuidePaymentSchema
>;
