import { z } from "zod";

// 매칭 제안 목록(`GET /v3/matching/influencer/proposal?campaignIdx=`, stage Swagger 2.2.4.12).
// 상태 코드는 모르는 값도 읽도록 문자열로 받고 트랜스포머가 거름. 쪽 나눔 없이 전체를 줌.

const count = z
  .number()
  .int()
  .nullish()
  .transform((value) => value ?? 0);

export const proposalListSchema = z.object({
  data: z
    .array(
      z.object({
        proposalIdx: z.number().int(),
        platformIdx: z.number().int(),
        platformId: z.string(),
        nickname: z
          .string()
          .nullish()
          .transform((value) => value ?? null),
        profileImageUrl: z
          .string()
          .nullish()
          .transform((value) => value ?? null),
        status: z.string(),
        awaitingResponseFrom: z
          .enum(["ADVERTISER", "INFLUENCER"])
          .nullish()
          .transform((value) => value ?? null),
        amount: z.number().int(),
        responseDeadline: z
          .string()
          .nullish()
          .transform((value) => value ?? null),
        lastMessageAt: z
          .string()
          .nullish()
          .transform((value) => value ?? null),
      }),
    )
    .nullish()
    .transform((value) => value ?? []),
  counts: z
    .object({
      total: count,
      proposed: count,
      negotiating: count,
      pendingPayment: count,
      matched: count,
      rejectedOrExpired: count,
    })
    .nullish()
    .transform(
      (value) =>
        value ?? {
          total: 0,
          proposed: 0,
          negotiating: 0,
          pendingPayment: 0,
          matched: 0,
          rejectedOrExpired: 0,
        },
    ),
  needsAttention: z
    .boolean()
    .nullish()
    .transform((value) => value ?? false),
});
export type ProposalListResponse = z.infer<typeof proposalListSchema>;
