import { z } from "zod";

import type { CampaignIntroDraft } from "@/entities/campaign";

// 생성 API가 아직 없어 개발 서버 목에서만 동작하고, 배포 빌드에서는 늘 실패(토스트)함.
async function loadIntroMock() {
  if (!import.meta.env.DEV) {
    throw new Error("The AI campaign intro API is not available yet.");
  }
  return import("./mock/intro-mock");
}

const generatedMediaSchema = z.object({
  attachmentIdx: z.number().int(),
  url: z.string(),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
});

const generatedIntroSchema = z.object({
  mainImage: generatedMediaSchema.nullable(),
  detailMedia: z.array(generatedMediaSchema),
  description: z.string(),
  notice: z.string(),
  titleHashtags: z.array(z.string()),
  contentHashtags: z.array(z.string()),
});

export async function generateCampaignIntro(
  campaignIdx: number,
  productUrl: string,
): Promise<CampaignIntroDraft> {
  const mock = await loadIntroMock();
  return generatedIntroSchema.parse(
    await mock.generateIntro(campaignIdx, productUrl),
  );
}
