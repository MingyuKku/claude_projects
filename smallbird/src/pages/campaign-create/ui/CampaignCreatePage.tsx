import { useNavigate, useNavigation, useSearchParams } from "react-router";
import { toast } from "sonner";

import { getNewCampaignRegisterPath } from "@/entities/campaign";
import {
  getSubscribedTypes,
  isActiveProductType,
  useSubscriptions,
} from "@/entities/subscription";
import { EmptyState } from "@/shared/components/empty-state";
import { Inform } from "@/shared/components/inform";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { PRODUCT_TYPES, SERVICE_CARDS } from "../model/services";
import { useScrollToProducts } from "../model/use-scroll-to-products";
import { ComingSoonServiceCard } from "./ComingSoonServiceCard";
import { ProductCard } from "./ProductCard";
import { ServiceCard } from "./ServiceCard";

import type { ProductType } from "../model/services";
import type { CampaignProductType } from "@/entities/campaign";
import type { ActiveProductType } from "@/entities/subscription";

const SERVICE_PARAM = "service";
const PRODUCT_TYPE_CODES: Record<ProductType, CampaignProductType> = {
  brand: "BRAND",
  groupBuy: "GROUP_BUY",
};
// 본문의 최대 폭(시안 PC 1440 화면의 본문 폭 1170 + 좌우 여백 20씩). 더 넓은 화면에서는 가운데 정렬함.
// 셸 본문은 여백이 없어 여기서 둠(MO 16, TAB·PC 20).
const CONTENT_WIDTH_CLASS_NAME = "mx-auto w-full max-w-302.5 ds-p-5";
const SECTION_CLASS_NAME = "flex flex-col ds-gap-4";
const SECTION_TITLE_CLASS_NAME = "ds-text-base-none-semibold";

// 캠페인 개설: 서비스(모집형·PICK형)와 상품(브랜드형·공구형)을 고르기만 하고 저장하는 것은 없음.
// 선택한 서비스는 `?service=`가 소유함. 상품 카드는 등록 마법사로 가고(구독 중이면 실제 등록, PICK형 미구독은 데모),
// 모집형 공구형과 모집형 데모는 아직 없어 "준비 중" 토스트를 띄움(스펙 status §3 상품 카드).
export function CampaignCreatePage() {
  const { t } = useTranslation("pages/campaign-create");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, isError, mutate } = useSubscriptions();

  // 등록 진입은 캠페인을 만들고 작성 화면으로 넘어갈 때까지 이 화면을 둠. 그사이 다시 누르면 하나를 더 만듦.
  // 만든 뒤에는 목적지가 작성 경로로 바뀌므로 등록 경로 전체로 봄.
  const isEnteringRegister =
    navigation.location?.pathname.startsWith(ROUTES.campaignRegister) ?? false;
  const serviceParam = searchParams.get(SERVICE_PARAM);
  const selectedService = isActiveProductType(serviceParam)
    ? serviceParam
    : null;
  const subscribedTypes = data ? getSubscribedTypes(data) : null;
  const isSelectedServiceSubscribed =
    selectedService !== null && Boolean(subscribedTypes?.has(selectedService));

  const { sectionRef, requestScroll } = useScrollToProducts(selectedService);

  function handleSelectService(type: ActiveProductType) {
    if (type !== selectedService) requestScroll();
    setSearchParams({ [SERVICE_PARAM]: type }, { replace: true });
  }

  function handleClickSubscribe() {
    void navigate(ROUTES.mypageSubscribe);
  }

  function handleClickProduct(product: ProductType) {
    if (isEnteringRegister) return;
    // 모집형 공구형은 아직 없음.
    if (
      selectedService === null ||
      (selectedService === "recruit" && product !== "brand")
    ) {
      toast(tCommon("status.comingSoon"));
      return;
    }
    const productType = PRODUCT_TYPE_CODES[product];
    if (isSelectedServiceSubscribed) {
      void navigate(
        getNewCampaignRegisterPath(selectedService, { productType }),
      );
      return;
    }
    if (selectedService === "pick") {
      void navigate(
        getNewCampaignRegisterPath("pick", { isDemo: true, productType }),
      );
      return;
    }
    toast(tCommon("status.comingSoon"));
  }

  const notice = (
    <Inform
      variant="filled"
      title={t("notice.title")}
      items={[
        { id: "demo", text: t("notice.demo") },
        { id: "subscribe", text: t("notice.subscribe") },
      ]}
    />
  );

  if (isLoading) {
    return (
      <div className={`${CONTENT_WIDTH_CLASS_NAME} flex flex-col ds-gap-6`}>
        <div className={SECTION_CLASS_NAME}>
          <p className={SECTION_TITLE_CLASS_NAME}>{t("section.service")}</p>
          <SkeletonGroup className="grid ds-gap-5 tablet:grid-cols-2 desktop:grid-cols-4">
            {SERVICE_CARDS.map((card) => (
              <Skeleton
                key={card.type}
                className="h-72 rounded-lg tablet:h-96"
              />
            ))}
          </SkeletonGroup>
        </div>
        {notice}
      </div>
    );
  }

  if (isError || !subscribedTypes) {
    return (
      <EmptyState
        type="alarm"
        title={t("error.subscriptions")}
        className="py-20"
        action={
          <Button variant="outline" onClick={() => void mutate()}>
            {tCommon("action.retry")}
          </Button>
        }
      />
    );
  }

  return (
    <div className={`${CONTENT_WIDTH_CLASS_NAME} flex flex-col ds-gap-6`}>
      <section className={SECTION_CLASS_NAME}>
        <h2 className={SECTION_TITLE_CLASS_NAME}>{t("section.service")}</h2>
        <div className="grid ds-gap-5 tablet:grid-cols-2 desktop:grid-cols-4">
          {SERVICE_CARDS.map((card) =>
            card.type === "live" || card.type === "applicator" ? (
              <ComingSoonServiceCard
                key={card.type}
                type={card.type}
                badges={card.badges}
              />
            ) : (
              <ServiceCard
                key={card.type}
                type={card.type}
                badges={card.badges}
                isSubscribed={subscribedTypes.has(card.type)}
                isSelected={selectedService === card.type}
                onSelect={handleSelectService}
                onClickSubscribe={handleClickSubscribe}
              />
            ),
          )}
        </div>
      </section>
      {selectedService && (
        <section ref={sectionRef} className={SECTION_CLASS_NAME}>
          <h2 className={SECTION_TITLE_CLASS_NAME}>{t("section.product")}</h2>
          <div className="grid ds-gap-5 tablet:grid-cols-2">
            {PRODUCT_TYPES.map((product) => (
              <ProductCard
                key={product}
                service={selectedService}
                product={product}
                isSubscribed={isSelectedServiceSubscribed}
                onClickProduct={() => handleClickProduct(product)}
              />
            ))}
          </div>
        </section>
      )}
      {notice}
    </div>
  );
}
