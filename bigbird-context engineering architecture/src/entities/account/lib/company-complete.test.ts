import { isCompanyInfoComplete } from "./company-complete";

import type { CompanyInfoViewModel } from "../model/mypage-schema";

const complete: CompanyInfoViewModel = {
  companyName: "빅버드",
  contact: "02-1234-5678",
  businessNumber: "123-45-67890",
  mailorderNumber: "2024-서울강남-00000",
  categoryIdx: null,
  categoryName: null,
  companyUrl: "",
  hasBusinessRegistrationFile: true,
  businessRegistrationFileName: "사업자등록증.pdf",
  hasMailorderFile: true,
  mailorderFileName: "신고증.png",
  hasBankBookFile: false,
};

describe("isCompanyInfoComplete", () => {
  it("회사정보가 없으면 미완성", () => {
    expect(isCompanyInfoComplete(null)).toBe(false);
  });

  it("필수 6개가 모두 있으면 완성(선택 항목·통장사본은 무관)", () => {
    expect(isCompanyInfoComplete(complete)).toBe(true);
  });

  it.each([
    ["회사명", { companyName: " " }],
    ["연락처", { contact: "" }],
    ["사업자 등록 번호", { businessNumber: "" }],
    ["통신판매번호", { mailorderNumber: "" }],
    ["사업자 등록증", { hasBusinessRegistrationFile: false }],
    ["통신판매업 신고증", { hasMailorderFile: false }],
  ])("%s이(가) 비어 있으면 미완성", (_name, patch) => {
    expect(isCompanyInfoComplete({ ...complete, ...patch })).toBe(false);
  });
});
