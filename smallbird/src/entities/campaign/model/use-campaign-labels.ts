import { useTranslation } from "@/shared/i18n";

import {
  isCampaignAddOn,
  isCampaignAgeGroup,
  isCampaignGender,
  isCampaignPlatform,
  isCampaignProductType,
  isCampaignServiceType,
  isCampaignTopic,
  isCampaignType,
} from "./codes";

/**
 * 서버 코드의 표시 문구. 슬라이스끼리 다른 namespace를 쓸 수 없어서 feature·page는 이 훅으로 받음.
 * 목록에 없는 코드가 오면 화면을 깨뜨리지 않고 서버 값을 그대로 돌려줌.
 */
export function useCampaignLabels() {
  const { t } = useTranslation("entities/campaign");

  return {
    serviceType: (code: string) =>
      isCampaignServiceType(code) ? t(`serviceType.${code}`) : code,
    productType: (code: string) =>
      isCampaignProductType(code) ? t(`productType.${code}`) : code,
    /** "PICK형 브랜드형"처럼 서비스 유형과 상품 유형을 합쳐 보여 줌. */
    serviceProduct: (serviceType: string, productType: string) =>
      isCampaignServiceType(serviceType) && isCampaignProductType(productType)
        ? t("serviceProduct", {
            service: t(`serviceType.${serviceType}`),
            product: t(`productType.${productType}`),
          })
        : `${serviceType} ${productType}`,
    campaignType: (code: string) =>
      isCampaignType(code) ? t(`campaignType.${code}`) : code,
    platform: (code: string) =>
      isCampaignPlatform(code) ? t(`platform.${code}`) : code,
    gender: (code: string) =>
      isCampaignGender(code) ? t(`gender.${code}`) : code,
    ageGroup: (code: string) =>
      isCampaignAgeGroup(code) ? t(`ageGroup.${code}`) : code,
    topic: (code: string) =>
      isCampaignTopic(code) ? t(`topic.${code}`) : code,
    addOn: (code: string) =>
      isCampaignAddOn(code) ? t(`addOn.${code}`) : code,
  };
}
