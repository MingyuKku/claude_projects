import { describe, expect, it } from "vitest";

import { mergeRealtimeMessages } from "./merge-realtime-messages";

import type { InquiryMessageViewModel } from "../model/schema";

const message = (
  patch: Partial<InquiryMessageViewModel>,
): InquiryMessageViewModel =>
  ({
    id: 1,
    isMine: false,
    kind: "text",
    body: "안녕하세요",
    createdAt: new Date(1000),
    attachment: null,
    ...patch,
  }) as InquiryMessageViewModel;

const thread = (threadIdx: number, messages: InquiryMessageViewModel[]) =>
  ({ threadIdx, messages }) as never;

describe("mergeRealtimeMessages", () => {
  it("진행 중 스레드의 REST 메시지는 빼고 상담 문서 메시지로 대체함", () => {
    const result = mergeRealtimeMessages(
      [
        thread(1, [
          message({ id: 7, body: "지난 상담", createdAt: new Date(500) }),
        ]),
        thread(2, [message({ id: 8, body: "REST 사본" })]),
      ],
      2,
      [message({ body: "실시간", createdAt: new Date(2000) })],
    );
    expect(result.map((m) => m.body)).toEqual(["지난 상담", "실시간"]);
  });

  it("같은 시각·발신·내용의 중복은 하나만 남기고 발신을 광고주 기준으로 뒤집음", () => {
    const result = mergeRealtimeMessages([], 2, [
      message({ isMine: true }),
      message({ isMine: true }),
      message({ isMine: false, body: "답변", createdAt: new Date(2000) }),
    ]);
    expect(result.map((m) => [m.body, m.isMine])).toEqual([
      ["안녕하세요", false],
      ["답변", true],
    ]);
  });

  it("상담 문서 메시지는 REST와 겹치지 않는 음수 id를 받음", () => {
    const result = mergeRealtimeMessages([], 2, [
      message({ body: "a" }),
      message({ body: "b", createdAt: new Date(2000) }),
    ]);
    expect(result.map((m) => m.id)).toEqual([-1, -2]);
  });
});
