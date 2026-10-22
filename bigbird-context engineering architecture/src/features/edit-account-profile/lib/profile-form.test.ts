import {
  canSaveProfile,
  getProfileSavePlan,
  validateProfileForm,
} from "./profile-form";

const context = { identifier: "hong1234", initialEmail: "old@bigbird.com" };
const empty = { password: "", passwordCheck: "", email: "old@bigbird.com" };

function evaluate(values: typeof empty, hasNewImage = false) {
  const errors = validateProfileForm(values, context);
  const plan = getProfileSavePlan(values, context.initialEmail, hasNewImage);
  return { errors, plan, canSave: canSaveProfile(values, errors, plan) };
}

describe("validateProfileForm", () => {
  it("아무것도 안 바꾸면 오류가 없다", () => {
    expect(evaluate(empty).errors).toEqual({
      password: null,
      passwordCheck: null,
      email: null,
    });
  });

  it("비밀번호 규칙 위반을 코드로 알린다", () => {
    expect(evaluate({ ...empty, password: "abc" }).errors.password).toBe(
      "format",
    );
    expect(
      evaluate({ ...empty, password: "hong1234!Ab" }).errors.password,
    ).toBe("containsId");
    expect(evaluate({ ...empty, password: "Aaaaa111!" }).errors.password).toBe(
      "repeated",
    );
  });

  it("확인 칸이 다르면 mismatch, 비어 있으면 알리지 않는다", () => {
    const password = "Wq!9a2k7xZ";
    expect(
      evaluate({ ...empty, password, passwordCheck: "other" }).errors
        .passwordCheck,
    ).toBe("mismatch");
    expect(
      evaluate({ ...empty, password, passwordCheck: "" }).errors.passwordCheck,
    ).toBeNull();
  });

  it("이메일은 바꿨을 때만 형식을 검사한다", () => {
    expect(evaluate({ ...empty, email: "bad" }).errors.email).toBe("format");
    expect(evaluate({ ...empty, email: "" }).errors.email).toBe("format");
    const legacy = validateProfileForm(
      { ...empty, email: "legacy@@x" },
      { identifier: "hong1234", initialEmail: "legacy@@x" },
    );
    expect(legacy.email).toBeNull();
  });
});

describe("canSaveProfile", () => {
  it("바꾼 것이 없으면 저장할 수 없다", () => {
    expect(evaluate(empty).canSave).toBe(false);
  });

  it("이메일만 바꿔도 저장할 수 있다", () => {
    expect(evaluate({ ...empty, email: "new@bigbird.com" }).canSave).toBe(true);
  });

  it("이미지만 골라도 저장할 수 있다", () => {
    expect(evaluate(empty, true).canSave).toBe(true);
  });

  it("비밀번호는 확인 칸까지 같게 채워야 저장할 수 있다", () => {
    const password = "Wq!9a2k7xZ";
    expect(evaluate({ ...empty, password }).canSave).toBe(false);
    expect(
      evaluate({ ...empty, password, passwordCheck: password }).canSave,
    ).toBe(true);
  });

  it("오류가 있으면 저장할 수 없다", () => {
    expect(evaluate({ ...empty, email: "bad" }).canSave).toBe(false);
  });
});
