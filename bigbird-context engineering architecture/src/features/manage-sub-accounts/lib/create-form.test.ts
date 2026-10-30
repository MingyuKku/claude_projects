import {
  canCreateSubAccount,
  canEditSubAccount,
  isUncheckableId,
  toCreateSubAccountBody,
  toEditFormValues,
  toUpdateSubAccountBody,
  validateCreateForm,
} from "./create-form";

import type { CreateFormValues } from "./create-form";

const valid: CreateFormValues = {
  name: "김담당",
  identifier: "sub_user01",
  password: "Wq!9a2k7xZ",
  passwordCheck: "Wq!9a2k7xZ",
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
    const values = { ...valid, name: "  " };
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
  it("공백을 지우고 휴대폰 번호는 빈 값으로 보낸다(시안에서 칸이 빠짐)", () => {
    expect(
      toCreateSubAccountBody({
        ...valid,
        name: " 김담당 ",
        identifier: " sub_user01 ",
      }),
    ).toEqual({
      id: "sub_user01",
      pw: "Wq!9a2k7xZ",
      name: "김담당",
      email: "sub@bigbird.com",
    });
  });
});

describe("canEditSubAccount", () => {
  const initial = toEditFormValues({
    name: "김담당",
    identifier: "sub_user01",
    email: "sub@bigbird.com",
  });
  const check = (
    values: CreateFormValues,
    status: "idle" | "available" = "idle",
  ) => canEditSubAccount(values, initial, validateCreateForm(values), status);

  it("아무것도 바꾸지 않았으면 저장할 수 없다", () => {
    expect(check(initial)).toBe(false);
  });

  it("담당자명이나 이메일만 바꿔도 저장할 수 있다(비밀번호·아이디 확인 불필요)", () => {
    expect(check({ ...initial, name: "이담당" })).toBe(true);
    expect(check({ ...initial, email: "new@bigbird.com" })).toBe(true);
  });

  it("아이디를 바꾸면 중복확인을 통과해야 한다", () => {
    const values = { ...initial, identifier: "sub_user02" };
    expect(check(values, "idle")).toBe(false);
    expect(check(values, "available")).toBe(true);
  });

  it("비밀번호를 바꾸려면 확인 칸이 같고 규칙을 지켜야 한다", () => {
    const password = "Wq!9a2k7xZ";
    expect(check({ ...initial, password })).toBe(false);
    expect(check({ ...initial, password, passwordCheck: "other" })).toBe(false);
    expect(check({ ...initial, password, passwordCheck: password })).toBe(true);
  });

  it("필수 칸을 비우면 저장할 수 없다", () => {
    expect(check({ ...initial, name: " " })).toBe(false);
  });
});

describe("toUpdateSubAccountBody", () => {
  const initial = toEditFormValues({
    name: "김담당",
    identifier: "sub_user01",
    email: "sub@bigbird.com",
  });

  it("바뀐 필드만 담고 앞뒤 공백은 지운다", () => {
    expect(
      toUpdateSubAccountBody(
        { ...initial, name: " 이담당 ", email: "new@bigbird.com" },
        initial,
      ),
    ).toEqual({ name: "이담당", email: "new@bigbird.com" });
  });

  it("아이디를 바꾸면 id로, 비밀번호는 입력했을 때만 pw로 담는다", () => {
    expect(
      toUpdateSubAccountBody(
        { ...initial, identifier: "sub_user02", password: "Wq!9a2k7xZ" },
        initial,
      ),
    ).toEqual({ id: "sub_user02", pw: "Wq!9a2k7xZ" });
    expect(toUpdateSubAccountBody(initial, initial)).toEqual({});
  });
});
