import { createJoinStore } from "../model/store";
import { buildJoinPayload } from "./build-join-payload";

function filledState() {
  const store = createJoinStore();
  const actions = store.getState();
  actions.applyCertSuccess({
    certIdx: 5,
    name: "n",
    phoneNumber: "01000000000",
  });
  actions.patchAccount({
    id: "tester01",
    password: "abcd1234",
    email: "a@b.co",
  });
  actions.patchCompany({
    companyName: "Acme",
    companyContact: "01099998888",
    companyRegistrationNumber: "1234567890",
  });
  actions.patchTerms({ service: true, privacy: true });
  return store;
}

describe("buildJoinPayload", () => {
  it("returns null before verification", () => {
    const { account, company, terms } = createJoinStore().getState();
    expect(buildJoinPayload(account, company, terms)).toBeNull();
  });

  it("maps fields to the server payload with nulls for optional values", () => {
    const { account, company, terms } = filledState().getState();
    expect(buildJoinPayload(account, company, terms)).toEqual({
      id: "tester01",
      pw: "abcd1234",
      certIdx: 5,
      email: "a@b.co",
      termsAgreed: true,
      personalInformationCollectionAgreed: true,
      companyName: "Acme",
      contact: "01099998888",
      companyRegistrationNumber: "1234567890",
      mailorderBusinessNumber: null,
      classification: null,
      companyUrl: null,
    });
  });

  it("builds the mail-order number, numeric classification and normalized url", () => {
    const store = filledState();
    store.getState().patchCompany({
      mailorderParts: ["2024", "서울강남", "01234"],
      classification: "12",
      companyUrl: "https://example.com/",
    });
    const { account, company, terms } = store.getState();
    const payload = buildJoinPayload(account, company, terms);
    expect(payload?.mailorderBusinessNumber).toBe("2024-서울강남-01234");
    expect(payload?.classification).toBe(12);
    expect(payload?.companyUrl).toMatch(/^https?:\/\/example\.com/);
  });
});
