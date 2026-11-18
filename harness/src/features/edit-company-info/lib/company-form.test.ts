import {
  EMPTY_FILES,
  isCompanyFormComplete,
  toCompanyFormValues,
  toExtraInformationBody,
} from "./company-form";

import type { CompanyInfoViewModel } from "@/entities/account";

const registered: CompanyInfoViewModel = {
  companyName: "주식회사 빅버드",
  contact: "01012345678",
  businessNumber: "123-45-67890",
  mailorderNumber: "2024-서울강남-1234",
  categoryIdx: 3,
  categoryName: "패션/의류",
  companyUrl: "https://bigbird.co.kr",
  hasBusinessRegistrationFile: true,
  businessRegistrationFileName: "사업자등록증.pdf",
  hasMailorderFile: true,
  mailorderFileName: "신고증.png",
  hasBankBookFile: false,
};

describe("toCompanyFormValues", () => {
  it("등록된 회사정보를 폼 값으로 옮기고 분류는 문자열로 바꾼다", () => {
    expect(toCompanyFormValues(registered)).toMatchObject({
      companyName: "주식회사 빅버드",
      categoryIdx: "3",
    });
  });

  it("회사정보가 없으면 모두 빈 값이다", () => {
    expect(toCompanyFormValues(null)).toEqual({
      companyName: "",
      contact: "",
      businessNumber: "",
      mailorderNumber: "",
      categoryIdx: "",
      companyUrl: "",
    });
  });
});

describe("isCompanyFormComplete", () => {
  const values = toCompanyFormValues(registered);

  it("필수 텍스트가 채워지고 서류가 등록돼 있으면 완료다", () => {
    expect(isCompanyFormComplete(values, EMPTY_FILES, registered)).toBe(true);
  });

  it("필수 텍스트가 하나라도 비거나 공백뿐이면 미완료다", () => {
    expect(
      isCompanyFormComplete(
        { ...values, contact: "   " },
        EMPTY_FILES,
        registered,
      ),
    ).toBe(false);
  });

  it("서류가 없고 고른 파일도 없으면 미완료, 고르면 완료다", () => {
    const unregistered = {
      ...registered,
      hasBusinessRegistrationFile: false,
    };
    expect(isCompanyFormComplete(values, EMPTY_FILES, unregistered)).toBe(
      false,
    );
    expect(
      isCompanyFormComplete(
        values,
        { ...EMPTY_FILES, businessRegistration: new File(["x"], "a.pdf") },
        unregistered,
      ),
    ).toBe(true);
  });

  it("회사 분류와 URL은 선택이라 비어도 완료다", () => {
    expect(
      isCompanyFormComplete(
        { ...values, categoryIdx: "", companyUrl: "" },
        EMPTY_FILES,
        registered,
      ),
    ).toBe(true);
  });

  it("회사정보가 없는 새 계정은 서류를 모두 골라야 완료다", () => {
    const filled = { ...values };
    expect(isCompanyFormComplete(filled, EMPTY_FILES, null)).toBe(false);
    expect(
      isCompanyFormComplete(
        filled,
        {
          businessRegistration: new File(["x"], "a.pdf"),
          mailorderReport: new File(["x"], "b.pdf"),
        },
        null,
      ),
    ).toBe(true);
  });
});

describe("toExtraInformationBody", () => {
  it("앞뒤 공백을 지우고 분류는 숫자로 바꾼다", () => {
    expect(
      toExtraInformationBody({
        companyName: " 빅버드 ",
        contact: "010",
        businessNumber: "123",
        mailorderNumber: "2024-1",
        categoryIdx: "3",
        companyUrl: " https://a.com ",
      }),
    ).toEqual({
      companyName: "빅버드",
      contact: "010",
      companyRegistrationNumber: "123",
      mailorderBusinessNumber: "2024-1",
      category: 3,
      companyUrl: "https://a.com",
    });
  });

  it("비어 있는 선택 항목은 보내지 않는다", () => {
    const body = toExtraInformationBody({
      ...toCompanyFormValues(null),
      companyName: "a",
      contact: "b",
      businessNumber: "c",
      mailorderNumber: "d",
    });
    expect(body.category).toBeUndefined();
    expect(body.companyUrl).toBeUndefined();
  });
});
