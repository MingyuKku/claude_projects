import { z } from "zod";

// 매칭 상세보기(`GET /v3/matching/influencer/proposal/{proposalIdx}/messages`·`/info`, stage Swagger 2026-11-27).
// Swagger가 대부분 선택 필드라 없으면 null로 맞춤. 상태 코드는 모르는 값도 읽도록 문자열로 받음.

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null);
const nullableNumber = z
  .number()
  .nullish()
  .transform((value) => value ?? null);

export const proposalMessagesSchema = z.object({
  messages: z
    .array(
      z.object({
        messageIdx: nullableNumber,
        body: z.string(),
        writeTime: nullableString,
        deleteTime: nullableString,
        isUserMessage: z.boolean(),
      }),
    )
    .nullish()
    .transform((value) => value ?? []),
  proposalCard: z
    .object({
      campaignName: z.string(),
      campaignType: nullableString,
      status: z.string(),
      currentRound: z.number().int(),
      currentAmount: z.number().int(),
      groupBuyFeeRate: nullableNumber,
      uploadScheduleStart: nullableString,
      uploadScheduleEnd: nullableString,
      responseDeadline: nullableString,
    })
    .nullish()
    .transform((value) => value ?? null),
});
export type ProposalMessagesResponse = z.infer<typeof proposalMessagesSchema>;

export const proposalInfoSchema = z.object({
  influencer: z.object({
    platformIdx: z.number().int(),
    platformId: z.string(),
    nickname: nullableString,
    profileImageUrl: nullableString,
  }),
  campaign: z.object({
    campaignName: z.string(),
    campaignType: nullableString,
    progressStatus: nullableString,
    progressStartDate: nullableString,
    progressEndDate: nullableString,
    campaignCode: nullableString,
  }),
  offer: z.object({
    initialAmount: z.number().int(),
    currentAmount: z.number().int(),
    uploadScheduleStart: nullableString,
    uploadScheduleEnd: nullableString,
  }),
  memo: nullableString,
});
export type ProposalInfoResponse = z.infer<typeof proposalInfoSchema>;
