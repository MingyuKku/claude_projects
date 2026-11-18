import { registerMockFile } from "@/shared/lib";

// AI 소개서 생성 목. 몇 초 기다린 뒤 공개 이미지(og-image)를 메인·상세 이미지로 올려 두고 예시 글을 돌려줌.
// http(s) 주소가 아니면 실패해 실패 토스트를 확인할 수 있게 함.
const GENERATE_DELAY_MS = 3000;
const SAMPLE_IMAGE_PATH = "/og-image.png";
const SAMPLE_DETAIL_COUNT = 3;

async function registerSampleImage() {
  const response = await fetch(SAMPLE_IMAGE_PATH);
  return registerMockFile(await response.blob());
}

export async function generateIntro(_campaignIdx: number, productUrl: string) {
  await new Promise((resolve) => setTimeout(resolve, GENERATE_DELAY_MS));
  if (!/^https?:\/\/\S+$/.test(productUrl.trim())) {
    throw new Error("invalid product url");
  }
  const mainImage = await registerSampleImage();
  const detailMedia = await Promise.all(
    Array.from({ length: SAMPLE_DETAIL_COUNT }, registerSampleImage),
  );
  return {
    mainImage,
    detailMedia,
    description:
      "일상 속 특별한 케어를 위한 신제품을 소개해 주세요.\n핵심 성분과 실제 사용 후 느낀 변화를 중심으로 소개해 주세요.",
    notice:
      "• 과장된 표현은 지양해 주세요.\n• 제품 사용 후 실제 경험을 바탕으로 솔직한 후기를 작성해 주세요.",
    titleHashtags: ["신제품"],
    contentHashtags: ["협찬", "체험단"],
  };
}
