import { createJoinStore } from "./store";

describe("join store", () => {
  it("starts on the info stage, unverified, seeded with the SNS identity", () => {
    const tokenData = { platform: "naver", email: "a@b.co", uid: "9" };
    const state = createJoinStore(tokenData).getState();
    expect(state.stage).toBe("info");
    expect(state.account.certIdx).toBeNull();
    expect(state.tokenData).toEqual(tokenData);
  });

  it("gives every store its own state", () => {
    const first = createJoinStore();
    const second = createJoinStore();
    first.getState().patchAccount({ id: "someone" });
    expect(second.getState().account.id).toBe("");
  });

  it("patches sections without touching other fields", () => {
    const store = createJoinStore();
    store.getState().patchAccount({ id: "tester01" });
    store.getState().patchAccount({ idStatus: "possible" });
    store.getState().patchCompany({ companyName: "Acme" });
    store.getState().patchTerms({ service: true });
    const state = store.getState();
    expect(state.account).toMatchObject({
      id: "tester01",
      idStatus: "possible",
    });
    expect(state.company.companyName).toBe("Acme");
    expect(state.terms).toEqual({ service: true, privacy: false });
  });

  it("moves between stages", () => {
    const store = createJoinStore();
    store.getState().setStage("company");
    store.getState().setStage("terms");
    expect(store.getState().stage).toBe("terms");
  });

  it("applies a verification result and defaults the contact to the verified phone", () => {
    const store = createJoinStore();
    store.getState().applyCertSuccess({
      certIdx: 7,
      name: "홍길동",
      phoneNumber: "01011112222",
    });
    const { account, company } = store.getState();
    expect(account).toMatchObject({
      certIdx: 7,
      name: "홍길동",
      phoneNumber: "01011112222",
    });
    expect(company.companyContact).toBe("01011112222");
  });

  it("resets to the initial state but keeps the SNS identity", () => {
    const tokenData = { platform: "kakao", email: "a@b.co", uid: "1" };
    const store = createJoinStore(tokenData);
    store.getState().patchAccount({ id: "tester01" });
    store.getState().setStage("terms");
    store.getState().reset();
    expect(store.getState().account.id).toBe("");
    expect(store.getState().stage).toBe("info");
    expect(store.getState().tokenData).toEqual(tokenData);
  });
});
