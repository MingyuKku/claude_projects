import { memberApi } from "@/shared/api";
import { SERVICE_INDEX } from "@/shared/config";

import {
  certDecryptResultSchema,
  certInitResultSchema,
  checkResultSchema,
  joinResultSchema,
  validPasswordResultSchema,
} from "../model/schema";

import type { JoinPayload } from "../model/types";

export async function checkId(id: string) {
  const response = await memberApi.post(`/check/id/${SERVICE_INDEX}`, { id });
  return checkResultSchema.parse(response);
}

export async function checkEmail(email: string) {
  const response = await memberApi.post(`/check/email/${SERVICE_INDEX}`, {
    email,
  });
  return checkResultSchema.parse(response);
}

export async function validPassword(
  id: string,
  password: string,
  certIdx: number,
) {
  const response = await memberApi.post("/valid/pw", {
    id,
    password,
    certIdx,
  });
  return validPasswordResultSchema.parse(response);
}

export async function certInit(service: string | number) {
  const response = await memberApi.get(`/cert/init/${service}`);
  return certInitResultSchema.parse(response);
}

export async function certDecrypt(recCert: string, certNum: string) {
  const response = await memberApi.get(`/cert/decrypte/${SERVICE_INDEX}`, {
    // Query keys are the server contract (snake_case).
    params: { rec_cert: recCert, certNum },
  });
  return certDecryptResultSchema.parse(response);
}

async function uploadFile(path: string, file: File) {
  const form = new FormData();
  form.append("multipartFile", file);
  await memberApi.post(path, form);
}

export function uploadCompanyRegistration(file: File) {
  return uploadFile("/file/upload/companyRegistration", file);
}

export function uploadMailorderBusiness(file: File) {
  return uploadFile("/file/upload/mailorderBusiness", file);
}

export async function joinSubmit(payload: JoinPayload) {
  const response = await memberApi.post(`/join/${SERVICE_INDEX}`, payload);
  return joinResultSchema.parse(response);
}
