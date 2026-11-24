import { z } from "zod";

import { serverApiV3 } from "@/shared/api";

const uploadedFileSchema = z.object({
  attachmentIdx: z.number().int(),
  url: z.string(),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
});
export type UploadedCampaignFile = z.infer<typeof uploadedFileSchema>;

/** 요구 명세 A-7 `POST /v3/campaign/files`. 브랜드 이미지·소개서 이미지/동영상을 먼저 올려 받은 번호를 저장 API에 넣음. */
export async function uploadCampaignFile(
  file: File,
): Promise<UploadedCampaignFile> {
  const body = new FormData();
  body.append("file", file);
  return uploadedFileSchema.parse(
    await serverApiV3.post("/campaign/files", body),
  );
}
