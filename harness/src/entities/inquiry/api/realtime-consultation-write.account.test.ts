import { updateHelpdeskAccount } from "./realtime-consultation-write";

const mocks = vi.hoisted(() => {
  class FirestoreError extends Error {
    constructor(readonly code: string) {
      super(code);
    }
  }
  return { FirestoreError, updateDoc: vi.fn(), setDoc: vi.fn() };
});

vi.mock("@/shared/api", () => ({ getFirestoreDb: async () => ({}) }));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...segments: string[]) => segments.join("/"),
  FirestoreError: mocks.FirestoreError,
  setDoc: mocks.setDoc,
  updateDoc: mocks.updateDoc,
}));

describe("updateHelpdeskAccount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("계정 문서의 주어진 필드만 부분 갱신한다", async () => {
    mocks.updateDoc.mockResolvedValue(undefined);
    await updateHelpdeskAccount(5971, { threadBoardType: 0 });
    expect(mocks.updateDoc).toHaveBeenCalledWith(
      "helpdesk/0.0.2/threadUserIdx/5971",
      { threadBoardType: 0 },
    );
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });

  it("문서가 없을 때만 문의 종류를 넣어 병합 쓰기로 만든다", async () => {
    mocks.updateDoc.mockRejectedValue(new mocks.FirestoreError("not-found"));
    await updateHelpdeskAccount(5971, { threadBoardType: 0 });
    expect(mocks.setDoc).toHaveBeenCalledWith(
      "helpdesk/0.0.2/threadUserIdx/5971",
      { threadBoardType: 0, senderUserServiceType: "광고주" },
      { merge: true },
    );
  });

  it("다른 오류는 그대로 던진다", async () => {
    mocks.updateDoc.mockRejectedValue(
      new mocks.FirestoreError("permission-denied"),
    );
    await expect(
      updateHelpdeskAccount(5971, { threadBoardType: 0 }),
    ).rejects.toThrow("permission-denied");
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });
});
