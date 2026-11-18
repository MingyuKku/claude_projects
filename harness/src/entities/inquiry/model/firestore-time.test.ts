import { normalizeFirestoreTime } from "./firestore-time";
import { realtimeConsultationSchema } from "./schema";

const at = new Date("2026-11-03T17:30:54");

describe("normalizeFirestoreTime", () => {
  it("Timestamp와 그것을 직렬화한 맵을 같은 문자열로 읽는다", () => {
    expect(normalizeFirestoreTime({ toDate: () => at })).toBe(
      "2026-11-03 17:30:54",
    );
    expect(
      normalizeFirestoreTime({
        type: "firestore/timestamp/1.0",
        seconds: at.getTime() / 1000,
        nanoseconds: 569000000,
      }),
    ).toBe("2026-11-03 17:30:54");
  });

  it("시각이 아닌 값은 그대로 둔다", () => {
    expect(normalizeFirestoreTime("2026-11-03 17:30:54")).toBe(
      "2026-11-03 17:30:54",
    );
    expect(normalizeFirestoreTime(null)).toBeNull();
  });

  it("stage 상담 문서(acceptedAt이 맵)를 오류 없이 읽는다", () => {
    const parsed = realtimeConsultationSchema.safeParse({
      acceptedAt: {
        type: "firestore/timestamp/1.0",
        seconds: at.getTime() / 1000,
        nanoseconds: 569000000,
      },
      campaignIdx: null,
      boardType: false,
      threadIdx: 2105,
      status: "IN_PROGRESS",
      sequence: 1278,
      finishTime: null,
      messages: [
        {
          auto: true,
          attachmentIdx: null,
          identifier: null,
          isUserMessage: false,
          body: "상담원과 연결되었습니다.",
          created: "2026-11-03 17:30:54",
        },
      ],
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.acceptedAt).toBe("2026-11-03 17:30:54");
  });
});
