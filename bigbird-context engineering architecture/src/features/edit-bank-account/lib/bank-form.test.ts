import {
  isBankFormComplete,
  toBankAccountBody,
  toBankFormValues,
} from "./bank-form";

const banks = [
  { idx: 1, name: "신한은행" },
  { idx: 2, name: "국민은행" },
];
const account = {
  bankName: "국민은행",
  accountNumber: "110-123-456789",
  accountHolder: "홍길동",
  hasBankBookFile: true,
};

describe("toBankFormValues", () => {
  it("은행 이름으로 목록에서 인덱스를 찾는다", () => {
    expect(toBankFormValues(account, banks).bankIdx).toBe("2");
  });

  it("목록에 없는 은행 이름이나 미등록 계좌는 은행을 비운다", () => {
    expect(
      toBankFormValues({ ...account, bankName: "없는은행" }, banks).bankIdx,
    ).toBe("");
    expect(toBankFormValues(null, banks)).toEqual({
      bankIdx: "",
      accountNumber: "",
      accountHolder: "",
    });
  });
});

describe("isBankFormComplete", () => {
  const values = toBankFormValues(account, banks);

  it("은행·계좌번호·예금주가 있고 통장사본이 등록돼 있으면 완료다", () => {
    expect(isBankFormComplete(values, null, account)).toBe(true);
  });

  it("통장사본이 없으면 파일을 골라야 완료다", () => {
    const noBankBook = { ...account, hasBankBookFile: false };
    expect(isBankFormComplete(values, null, noBankBook)).toBe(false);
    expect(
      isBankFormComplete(values, new File(["x"], "a.pdf"), noBankBook),
    ).toBe(true);
  });

  it("은행을 고르지 않았거나 공백뿐인 항목이 있으면 미완료다", () => {
    expect(isBankFormComplete({ ...values, bankIdx: "" }, null, account)).toBe(
      false,
    );
    expect(
      isBankFormComplete({ ...values, accountHolder: "  " }, null, account),
    ).toBe(false);
  });
});

describe("toBankAccountBody", () => {
  it("계좌번호의 하이픈·공백을 지우고 은행 인덱스는 숫자로 바꾼다", () => {
    expect(
      toBankAccountBody({
        bankIdx: "2",
        accountNumber: " 110-123 456789 ",
        accountHolder: " 홍길동 ",
      }),
    ).toEqual({
      bankIdx: 2,
      accountNumber: "110123456789",
      accountHolder: "홍길동",
    });
  });
});
