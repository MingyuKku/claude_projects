import { serverApiV3 } from "@/shared/api";

import { companyCategoryListSchema } from "../model/schema";

export interface ExtraInformationBody {
  companyName: string;
  contact: string;
  companyRegistrationNumber: string;
  mailorderBusinessNumber: string;
  category?: number;
  companyUrl?: string;
}

export async function fetchCompanyCategories() {
  const response = await serverApiV3.get("/mypage/account/extra/category");
  return companyCategoryListSchema.parse(response).category;
}

/** 처음 등록. 필수값(회사명·연락처·사업자 등록 번호·통신판매업 신고번호)을 서버가 검증함. */
export function registerCompanyInfo(body: ExtraInformationBody) {
  return serverApiV3.post("/mypage/account/extra", body);
}

/** 수정. 보내지 않은 필드는 null로 덮어써지므로 항상 전체 필드를 보냄. */
export function updateCompanyInfo(body: ExtraInformationBody) {
  return serverApiV3.put("/mypage/account/extra", body);
}

function toFormData(file: File) {
  const body = new FormData();
  body.append("file", file);
  return body;
}

/** 업로드는 항상 HTTP 200이고 `result`·`reason`으로 성공을 가름. 회사정보가 먼저 등록돼 있어야 함. */
export function uploadBusinessRegistration(file: File) {
  return serverApiV3.post(
    "/mypage/account/extra/registration/upload",
    toFormData(file),
  );
}

export function uploadMailorderReport(file: File) {
  return serverApiV3.post(
    "/mypage/account/extra/mailorder/upload",
    toFormData(file),
  );
}
