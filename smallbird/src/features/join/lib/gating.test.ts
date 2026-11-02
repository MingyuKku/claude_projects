import {
  canProceedFromCompany,
  canProceedFromInfo,
  canSubmitTerms,
  resolveInputState,
  resolveMessageClass,
} from "./gating";

const validInfo = {
  id: "tester01",
  password: "abcd1234",
  passwordAgain: "abcd1234",
  idStatus: "possible" as const,
  passwordError: null,
};

describe("canProceedFromInfo", () => {
  it("passes when every field is filled, id is available and passwords match", () => {
    expect(canProceedFromInfo(validInfo)).toBe(true);
  });

  it.each([
    ["id not checked", { idStatus: "idle" as const }],
    ["id taken", { idStatus: "wrong" as const }],
    ["password rule violated", { passwordError: "bad" }],
    ["passwords differ", { passwordAgain: "other" }],
    ["confirmation empty", { passwordAgain: "" }],
    ["id empty", { id: "" }],
  ])("blocks when %s", (_name, patch) => {
    expect(canProceedFromInfo({ ...validInfo, ...patch })).toBe(false);
  });
});

describe("canProceedFromCompany", () => {
  const account = { email: "a@b.co", emailStatus: "possible" as const };
  const company = {
    companyName: "Acme",
    companyContact: "01012345678",
    companyRegistrationUploaded: true,
    companyRegistrationNumber: "1234567890",
  };

  it("passes with all required values and an available email", () => {
    expect(canProceedFromCompany(account, company)).toBe(true);
  });

  it("blocks without the business registration upload", () => {
    expect(
      canProceedFromCompany(account, {
        ...company,
        companyRegistrationUploaded: false,
      }),
    ).toBe(false);
  });

  it("blocks until the email duplicate check says possible", () => {
    expect(
      canProceedFromCompany({ ...account, emailStatus: "idle" }, company),
    ).toBe(false);
  });
});

describe("canSubmitTerms", () => {
  it("needs both terms and a completed verification", () => {
    const terms = { service: true, privacy: true };
    expect(canSubmitTerms(terms, { certIdx: 3 })).toBe(true);
    expect(canSubmitTerms(terms, { certIdx: null })).toBe(false);
    expect(
      canSubmitTerms({ service: true, privacy: false }, { certIdx: 3 }),
    ).toBe(false);
  });
});

describe("field state helpers", () => {
  it("lets error win for borders and success win for message color", () => {
    expect(resolveInputState(true, true)).toBe("error");
    expect(resolveInputState(false, true)).toBe("success");
    expect(resolveInputState(false, false)).toBe("default");
    expect(resolveMessageClass(true, true)).toBe("text-positive!");
    expect(resolveMessageClass(true, false)).toBe("text-negative!");
    expect(resolveMessageClass(false, false)).toBe("text-gray-400!");
  });
});
