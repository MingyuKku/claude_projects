import { realtimeConsultationSchema } from "./schema";

describe("realtimeConsultationSchema", () => {
  // 2026-10-29 dev Firestore의 일반 문의 문서 모양(sequence·threadIdx·isConnect 없음, Timestamp, isUserMessage null).
  it("일반 문의 문서도 읽는다", () => {
    const result = realtimeConsultationSchema.safeParse({
      boardType: true,
      campaignIdx: 5461,
      finishTime: { toDate: () => new Date(2026, 9, 28, 12, 37, 2) },
      status: "ANSWERED",
      messages: [
        {
          auto: false,
          attachmentIdx: null,
          identifier: null,
          isUserMessage: null,
          body: "문의",
          created: "2026-10-28 12:06:29",
          messageId: "4142-1849",
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.finishTime).toBe("2026-10-28 12:37:02");
    expect(result.data?.messages[0]?.isUserMessage).toBeNull();
  });

  it("finishTime이 없거나 문자열이어도 읽는다", () => {
    const base = { messages: [] };

    expect(
      realtimeConsultationSchema.parse({ ...base, finishTime: null })
        .finishTime,
    ).toBeNull();
    expect(
      realtimeConsultationSchema.parse({
        ...base,
        finishTime: "2026-10-28 09:58:03",
      }).finishTime,
    ).toBe("2026-10-28 09:58:03");
  });
});
