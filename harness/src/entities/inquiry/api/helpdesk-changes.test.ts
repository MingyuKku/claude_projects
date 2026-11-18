import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useBuyerAccountChanges,
  useInquirySummaryChanges,
} from "./helpdesk-changes";

const mocks = vi.hoisted(() => ({
  getFirestoreDb: vi.fn(async () => ({})),
  collection: vi.fn((_db: unknown, path: string) => ({ path })),
  doc: vi.fn((_db: unknown, path: string) => ({ path })),
  onSnapshot: vi.fn(),
  query: vi.fn((ref: unknown, ...constraints: unknown[]) => ({
    ref,
    constraints,
  })),
  where: vi.fn((field: string, op: string, value: unknown) => ({
    field,
    op,
    value,
  })),
}));

vi.mock("@/shared/api", () => ({ getFirestoreDb: mocks.getFirestoreDb }));
vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  doc: mocks.doc,
  onSnapshot: mocks.onSnapshot,
  query: mocks.query,
  where: mocks.where,
  Timestamp: { fromDate: (date: Date) => ({ seconds: date.getTime() / 1000 }) },
}));

/** 마지막 구독의 스냅숏 콜백. */
function emitSnapshot() {
  const [, onNext] = mocks.onSnapshot.mock.lastCall as [unknown, () => void];
  onNext();
}

describe("useInquirySummaryChanges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onSnapshot.mockReturnValue(vi.fn());
  });

  it("내 summary 컬렉션을 구독하고 첫 스냅숏 뒤의 변경에서만 다시 받는다", async () => {
    const onChange = vi.fn();
    renderHook(() => useInquirySummaryChanges(5971, onChange));

    await waitFor(() => expect(mocks.onSnapshot).toHaveBeenCalledOnce());
    expect(mocks.collection).toHaveBeenCalledWith(
      expect.anything(),
      "helpdesk/0.0.2/threadUserIdx/5971/summary",
    );
    emitSnapshot();
    expect(onChange).not.toHaveBeenCalled();
    emitSnapshot();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("화면을 연 뒤 메시지가 생긴 요약만 구독한다", async () => {
    renderHook(() => useInquirySummaryChanges(5971, vi.fn()));
    await waitFor(() => expect(mocks.onSnapshot).toHaveBeenCalledOnce());
    expect(mocks.where).toHaveBeenCalledWith(
      "lastMessageAt",
      ">",
      expect.anything(),
    );
  });

  it("콜백이 바뀌어도 다시 구독하지 않고 새 콜백을 부른다", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ onChange }) => useInquirySummaryChanges(5971, onChange),
      { initialProps: { onChange: first } },
    );
    await waitFor(() => expect(mocks.onSnapshot).toHaveBeenCalledOnce());
    rerender({ onChange: second });
    emitSnapshot();
    emitSnapshot();
    expect(mocks.onSnapshot).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("화면을 떠나면 구독을 해제한다", async () => {
    const unsubscribe = vi.fn();
    mocks.onSnapshot.mockReturnValue(unsubscribe);
    const { unmount } = renderHook(() =>
      useInquirySummaryChanges(5971, vi.fn()),
    );

    await waitFor(() => expect(mocks.onSnapshot).toHaveBeenCalledOnce());
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("세션을 모르면 구독하지 않는다", () => {
    renderHook(() => useInquirySummaryChanges(undefined, vi.fn()));
    expect(mocks.getFirestoreDb).not.toHaveBeenCalled();
  });
});

/** 마지막 구독(구매자 계정 문서)의 스냅숏 콜백. */
function emitAccount(alarmData: unknown = null) {
  const [, onNext] = mocks.onSnapshot.mock.lastCall as [
    unknown,
    (snapshot: { get: (field: string) => unknown }) => void,
  ];
  onNext({ get: () => alarmData });
}

describe("useBuyerAccountChanges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onSnapshot.mockReturnValue(vi.fn());
  });

  it("목록의 구매자 계정을 한 번씩만 구독하고, 빠진 계정은 해제하며, 첫 스냅숏 뒤 변경에서 다시 받는다", async () => {
    const onChange = vi.fn();
    const stop = vi.fn();
    mocks.onSnapshot.mockReturnValueOnce(stop);
    const { rerender, unmount } = renderHook(
      ({ ids }) => useBuyerAccountChanges(ids, onChange),
      { initialProps: { ids: [5546, 5546] } },
    );
    await waitFor(() => expect(mocks.onSnapshot).toHaveBeenCalledOnce());
    expect(mocks.doc).toHaveBeenCalledWith(
      expect.anything(),
      "helpdesk/0.0.2/threadUserIdx/5546",
    );
    emitAccount();
    expect(onChange).not.toHaveBeenCalled();
    emitAccount();
    expect(onChange).toHaveBeenCalledOnce();

    rerender({ ids: [5546, 530] });
    await waitFor(() => expect(mocks.onSnapshot).toHaveBeenCalledTimes(2));
    rerender({ ids: [530] });
    expect(stop).toHaveBeenCalledOnce();

    unmount();
    expect(mocks.onSnapshot).toHaveBeenCalledTimes(2);
  });

  it("새 실시간 상담 요청 알림만 알리고 처음부터 있던 알림·같은 알림은 다시 알리지 않는다", async () => {
    const onAlarm = vi.fn();
    renderHook(() => useBuyerAccountChanges([5546], vi.fn(), onAlarm));
    await waitFor(() => expect(mocks.onSnapshot).toHaveBeenCalledOnce());
    const old = { title: "old 에서/ 상담을 요청하였습니다." };
    const next = {
      title: "buyer 에서/ 상담을 요청하였습니다.",
      campaignIdx: 6089,
    };

    emitAccount(old);
    emitAccount(old);
    expect(onAlarm).not.toHaveBeenCalled();
    emitAccount(null);
    emitAccount(next);
    emitAccount(next);
    expect(onAlarm).toHaveBeenCalledExactlyOnceWith(5546, next);
  });
});
