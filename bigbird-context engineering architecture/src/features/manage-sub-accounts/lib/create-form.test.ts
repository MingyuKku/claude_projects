import {
  canCreateSubAccount,
  isUncheckableId,
  toCreateSubAccountBody,
  validateCreateForm,
} from "./create-form";

import type { CreateFormValues } from "./create-form";

const valid: CreateFormValues = {
  name: "김담당",
  identifier: "sub_user01",
  password: "Wq!9a2k7xZ",
  passwordCheck: "Wq!9a2k7xZ",
  phone: "010-1234-5678",
  email: "sub@bigbird.com",
};

describe("validateCreateForm", () => {
  it("모두 비어 있으면 오류가 없다(입력 전)", () => {
    expect(
      validateCreateForm({
        name: "",
        identifier: "",
        password: "",
        passwordCheck: "",
        phone: "",
        email: "",
      }),
    ).toEqual({
      identifier: null,
      password: null,
      passwordCheck: null,
      email: null,
    });
  });

  it("아이디 형식·비밀번호 규칙·확인 불일치·이메일 형식을 알린다", () => {
    const errors = validateCreateForm({
      ...valid,
      identifier: "ab",
      password: "abc",
      passwordCheck: "other",
      email: "bad",
    });
    expect(errors).toEqual({
      identifier: "format",
      password: "format",
      passwordCheck: "mismatch",
      email: "format",
    });
  });

  it("비밀번호에 아이디가 들어가면 containsId다", () => {
    expect(
      validateCreateForm({ ...valid, password: "sub_user01!Ab" }).password,
    ).toBe("containsId");
  });
});

describe("isUncheckableId", () => {
  it("형식 위반과 금지어는 서버에 묻지 않는다", () => {
    expect(isUncheckableId("ab")).toBe(true);
    expect(isUncheckableId("myadmin01")).toBe(true);
    expect(isUncheckableId("sub_user01")).toBe(false);
  });
});

describe("canCreateSubAccount", () => {
  const noErrors = validateCreateForm(valid);

  it("모두 채우고 오류가 없고 중복확인을 통과하면 생성할 수 있다", () => {
    expect(canCreateSubAccount(valid, noErrors, "available")).toBe(true);
  });

  it("중복확인을 아직 안 했거나 중복·오류 결과면 생성할 수 없다", () => {
    for (const status of ["idle", "taken", "error"] as const) {
      expect(canCreateSubAccount(valid, noErrors, status)).toBe(false);
    }
  });

  it("비어 있는 칸이 하나라도 있으면 생성할 수 없다", () => {
    const values = { ...valid, phone: "  " };
    expect(
      canCreateSubAccount(values, validateCreateForm(values), "available"),
    ).toBe(false);
  });

  it("오류가 있으면 생성할 수 없다", () => {
    const values = { ...valid, passwordCheck: "other" };
    expect(
      canCreateSubAccount(values, validateCreateForm(values), "available"),
    ).toBe(false);
  });
});

describe("toCreateSubAccountBody", () => {
  it("공백을 지우고 휴대폰 번호는 숫자만 보낸다", () => {
    expect(
      toCreateSubAccountBody({
        ...valid,
        name: " 김담당 ",
        identifier: " sub_user01 ",
        phone: "010-1234-5678",
      }),
    ).toEqual({
      id: "sub_user01",
      pw: "Wq!9a2k7xZ",
      name: "김담당",
      email: "sub@bigbird.com",
      phone: "01012345678",
    });
  });
});
