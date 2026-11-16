import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import {
  getSubscribedTypes,
  isActiveProductType,
  useSubscriptions,
} from "@/entities/subscription";
import { EmptyState } from "@/shared/components/empty-state";
import { Inform } from "@/shared/components/inform";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { PRODUCT_TYPES, SERVICE_CARDS } from "../model/services";
import { ComingSoonServiceCard } from "./ComingSoonServiceCard";
import { ProductCard } from "./ProductCard";
import { ServiceCard } from "./ServiceCard";

import type { ActiveProductType } from "@/entities/subscription";

const SERVICE_PARAM = "service";
// 본문의 최대 폭(시안 PC 1440 화면의 본문 폭 1170 + 좌우 여백 20씩). 더 넓은 화면에서는 가운데 정렬함.
// 셸 본문은 여백이 없어 여기서 둠(MO 16, TAB·PC 20).
const CONTENT_WIDTH_CLASS_NAME = "mx-auto w-full max-w-302.5 ds-p-5";
const SECTION_CLASS_NAME = "flex flex-col ds-gap-4";
const SECTION_TITLE_CLASS_NAME = "ds-text-base-none-semibold";

// 캠페인 개설: 서비스(모집형·PICK형)와 상품(브랜드형·공구형)을 고르기만 하고 저장하는 것은 없음.
// 선택한 서비스는 `?service=`가 소유함. 등록 마법사와 공구형·모집형 데모는 아직 없어 상품 카드는 "준비 중" 토스트를 띄움.
export function CampaignCreatePage() {
  const { t } = useTranslation("pages/campaign-create");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, isError, mutate } = useSubscriptions();

  const serviceParam = searchParams.get(SERVICE_PARAM);
  const selectedService = isActiveProductType(serviceParam)
    ? serviceParam
    : null;
  const subscribedTypes = data ? getSubscribedTypes(data) : null;
  const isSelectedServiceSubscribed =
    selectedService !== null && Boolean(subscribedTypes?.has(selectedService));

  function handleSelectService(type: ActiveProductType) {
    setSearchParams({ [SERVICE_PARAM]: type }, { replace: true });
  }

  function handleClickSubscribe() {
    void navigate(ROUTES.mypageSubscribe);
  }

  function handleClickProduct() {
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
          <div className="grid ds-gap-5 tablet:grid-cols-2 desktop:grid-cols-4">
            {SERVICE_CARDS.map((card) => (
              <Skeleton
                key={card.type}
                className="h-72 rounded-lg tablet:h-96"
              />
            ))}
          </div>
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
        <section className={SECTION_CLASS_NAME}>
          <h2 className={SECTION_TITLE_CLASS_NAME}>{t("section.product")}</h2>
          <div className="grid ds-gap-5 tablet:grid-cols-2">
            {PRODUCT_TYPES.map((product) => (
              <ProductCard
                key={product}
                service={selectedService}
                product={product}
                isSubscribed={isSelectedServiceSubscribed}
                onClickProduct={handleClickProduct}
              />
            ))}
          </div>
        </section>
      )}
      {notice}
    </div>
  );
}
