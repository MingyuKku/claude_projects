import { tryit } from "radash";

import {
  isSimpleSuccess,
  readFailureReason,
  readResultFailure,
} from "@/entities/account";

import {
  registerCompanyInfo,
  updateCompanyInfo,
  uploadBusinessRegistration,
  uploadMailorderReport,
} from "../api/company-api";
import { toExtraInformationBody } from "./company-form";

import type { CompanyFormFiles, CompanyFormValues } from "./company-form";

export type CompanySaveStep =
  "info" | "businessRegistration" | "mailorderReport";

export interface CompanySaveResult {
  /** 회사정보 텍스트가 서버에 반영됐는지. 서류 업로드가 실패해도 true일 수 있음. */
  hasSavedInfo: boolean;
  /** 실패한 단계. 모두 성공하면 null. */
  failedStep: CompanySaveStep | null;
  /** 서버가 알려 준 실패 사유. 모르면 빈 문자열. */
  reason: string;
}

interface SaveParams {
  /** 이미 등록된 회사정보가 있으면 수정(PUT), 없으면 등록(POST). */
  isRegistered: boolean;
  values: CompanyFormValues;
  files: CompanyFormFiles;
}

/**
 * 회사정보를 먼저 저장하고 고른 서류를 올림. 업로드 API가 회사정보 등록을 전제하기 때문.
 * 첫 실패에서 멈추고, 어디까지 반영됐는지를 돌려줌.
 */
export async function saveCompanyInfo({
  isRegistered,
  values,
  files,
}: SaveParams): Promise<CompanySaveResult> {
  const save = isRegistered ? updateCompanyInfo : registerCompanyInfo;
  const [infoError, infoResponse] = await tryit(save)(
    toExtraInformationBody(values),
  );
  if (infoError || !isSimpleSuccess(infoResponse)) {
    return {
      hasSavedInfo: false,
      failedStep: "info",
      reason: readFailureReason(infoError) ?? "",
    };
  }

  const uploads = [
    [
      "businessRegistration",
      files.businessRegistration,
      uploadBusinessRegistration,
    ],
    ["mailorderReport", files.mailorderReport, uploadMailorderReport],
  ] as const;

  for (const [step, file, upload] of uploads) {
    if (!file) continue;
    const [uploadError, uploadResponse] = await tryit(upload)(file);
    const failure = uploadError
      ? (readFailureReason(uploadError) ?? "")
      : readResultFailure(uploadResponse);
    if (uploadError || failure !== null) {
      return {
        hasSavedInfo: true,
        failedStep: step,
        reason: failure ?? "",
      };
    }
  }

  return { hasSavedInfo: true, failedStep: null, reason: "" };
}
