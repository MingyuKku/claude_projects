import { z } from "zod";

// 요구 명세 A-7 `POST /v3/campaign/files`. 브랜드 이미지·소개서 이미지/동영상을 먼저 올려 받은 번호를 저장 API에 넣음.
// API가 연결되기 전까지는 개발 서버에서만 목이 응답함.
async function loadFileMock() {
  if (!import.meta.env.DEV) {
    throw new Error("The campaign file API is not available yet.");
  }
  return import("./mock/file-mock");
}

const uploadedFileSchema = z.object({
  attachmentIdx: z.number().int(),
  url: z.string(),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
});
export type UploadedCampaignFile = z.infer<typeof uploadedFileSchema>;

export async function uploadCampaignFile(
  file: File,
): Promise<UploadedCampaignFile> {
  const mock = await loadFileMock();
  return uploadedFileSchema.parse(await mock.uploadFile(file));
}
