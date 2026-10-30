import { useSearchParams } from "react-router";

import {
  IS_SUBSCRIPTION_MOCK_ENABLED,
  isBillingPeriod,
  isActiveProductType,
} from "@/entities/subscription";
import { SubscriptionPlanList } from "@/features/browse-subscription-plans";
import {
  CheckoutPanel,
  PaymentResultHandler,
} from "@/features/checkout-subscription";
import {
  BillingCardList,
  BillingCardResultHandler,
} from "@/features/manage-billing-cards";
import { SubscribedProductTable } from "@/features/manage-subscription";
import { LIST_QUERY_PARAMS, PaymentHistory } from "@/features/payment-history";
import { SubscriptionUsageDashboard } from "@/features/view-subscription-usage";
import { EmptyState } from "@/shared/components/empty-state";
import { useFilterScreen } from "@/shared/components/list-filter";
import { useTranslation } from "@/shared/i18n";
import { usePanelParam, useTabParam } from "@/shared/lib";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import {
  CHECKOUT_PERIOD_PARAM,
  CHECKOUT_PLAN_PARAM,
  SUBSCRIBE_PANELS,
  SUBSCRIBE_TABS,
  USAGE_TYPE_PARAM,
} from "../model/tabs";
import { PlanCardsSkeleton } from "./PlanCardsSkeleton";
import { SubscribedProductSkeleton } from "./SubscribedProductSkeleton";
import { SubscriptionPlansGate } from "./SubscriptionPlansGate";
import { SubscriptionsGate } from "./SubscriptionsGate";
import { UsageSkeleton } from "./UsageSkeleton";

import type { ActiveProductType, Subscription } from "@/entities/subscription";

// 탭 본문의 최대 폭(시안 PC 1440 화면의 본문 폭 1170). 더 넓은 화면에서는 가운데 정렬함.
const CONTENT_WIDTH_CLASS_NAME = "mx-auto w-full max-w-292.5";
// 탭을 바꾸면 하위 화면·상품 세그먼트·결제 내역 목록 쿼리(검색·필터·쪽)를 지움.
const RESET_PARAMS = [
  "panel",
  CHECKOUT_PLAN_PARAM,
  CHECKOUT_PERIOD_PARAM,
  USAGE_TYPE_PARAM,
  ...LIST_QUERY_PARAMS,
];

// 셸(헤더·LNB)은 app 레이어의 MypageLayout이 감쌈. 탭·세그먼트·하위 화면은 URL 쿼리가 소유함(뒤로 가기로 닫히고 새로고침해도 유지).
export function MyPageSubscribePage() {
  const { t } = useTranslation("pages/mypage-subscribe");
  const { t: tCommon } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tab, setTab } = useTabParam({
    tabs: SUBSCRIBE_TABS,
    defaultTab: "plans",
    resetParams: RESET_PARAMS,
  });
  const { panel, openPanel, closePanel } = usePanelParam({
    panels: SUBSCRIBE_PANELS,
    linkedParams: [CHECKOUT_PLAN_PARAM, CHECKOUT_PERIOD_PARAM],
  });
  const filterScreen = useFilterScreen("desktop");

  // 구독 API가 공개되기 전 빌드(stage·prod)에서는 목을 쓰지 않고 준비 중으로 둠(account.md §1). API가 공개되면 지움.
  if (!IS_SUBSCRIPTION_MOCK_ENABLED) {
    return (
      <>
        <title>{t("title")}</title>
        <div className="flex min-h-full items-center justify-center">
          <EmptyState
            type="construction"
            title={tCommon("status.comingSoon")}
          />
        </div>
      </>
    );
  }

  const checkoutParam = searchParams.get(CHECKOUT_PLAN_PARAM);
  const checkoutType = isActiveProductType(checkoutParam)
    ? checkoutParam
    : null;
  const periodParam = searchParams.get(CHECKOUT_PERIOD_PARAM);
  const checkoutPeriod = isBillingPeriod(periodParam) ? periodParam : "monthly";
  // 결제 화면은 구독 탭에서 상품이 정해졌을 때만 열림(주소를 직접 고쳐 다른 탭·잘못된 상품을 넣어도 무시).
  const isCheckout =
    panel === "checkout" && tab === "plans" && checkoutType !== null;
  // TAB의 결제내역 필터 화면은 탭 줄까지 덮는 본문 전체 화면(탭 숨김은 의도, 스펙 §3).
  const isTabletFilter = tab === "payments" && filterScreen.isOpen;

  // 이용요약 세그먼트: 쿼리가 없으면 구독 중인 첫 상품, 구독이 없으면 모집형.
  const typeParam = searchParams.get(USAGE_TYPE_PARAM);

  function resolveUsageType(subscriptions: Subscription[]): ActiveProductType {
    if (isActiveProductType(typeParam)) return typeParam;
    const firstSubscribed = subscriptions
      .map((item) => item.type)
      .find(isActiveProductType);
    return firstSubscribed ?? "recruit";
  }

  function handleChangeUsageType(next: ActiveProductType) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set(USAGE_TYPE_PARAM, next);
        return params;
      },
      { replace: true },
    );
  }

  if (isCheckout) {
    return (
      <>
        <title>{t("title")}</title>
        <div
          className={`${CONTENT_WIDTH_CLASS_NAME} pt-2 pb-4 tablet:pt-4 tablet:pb-5 desktop:pt-5`}
        >
          <SubscriptionPlansGate>
            {(catalog) => (
              <CheckoutPanel
                catalog={catalog}
                type={checkoutType}
                period={checkoutPeriod}
                onCancel={closePanel}
              />
            )}
          </SubscriptionPlansGate>
        </div>
      </>
    );
  }

  return (
    <>
      <title>{t("title")}</title>
      <PaymentResultHandler />
      {/* 카드 추가 후에는 카드가 보이는 결제내역 탭으로 옮김. */}
      <BillingCardResultHandler
        onRegistered={(params) => params.set("tab", "payments")}
      />
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="gap-4 tablet:gap-5 desktop:gap-6"
      >
        {!isTabletFilter && (
          // 탭 줄은 스크롤해도 화면 위에 고정함. 위 여백은 고정 영역이 직접 가져 스크롤 내용이 그 위로 비치지 않게 함.
          <div className="sticky top-0 z-10 -mx-(--mypage-gutter) bg-background px-(--mypage-gutter) pt-2 tablet:mx-0 tablet:px-0 desktop:pt-5">
            <TabsList variant="line" className="w-full justify-start">
              {SUBSCRIBE_TABS.map((subscribeTab) => (
                <TabsTrigger
                  key={subscribeTab}
                  value={subscribeTab}
                  className="flex-1 tablet:flex-none"
                >
                  {t(`tabs.${subscribeTab}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        )}
        <TabsContent
          value="plans"
          className={`${CONTENT_WIDTH_CLASS_NAME} pb-4 tablet:pb-5`}
        >
          <SubscriptionPlansGate>
            {(catalog) => (
              <SubscriptionsGate skeleton={<PlanCardsSkeleton />}>
                {(subscriptions) => (
                  <SubscriptionPlanList
                    catalog={catalog}
                    subscriptions={subscriptions}
                    onSubscribe={(type, period) =>
                      openPanel("checkout", {
                        [CHECKOUT_PLAN_PARAM]: type,
                        [CHECKOUT_PERIOD_PARAM]: period,
                      })
                    }
                  />
                )}
              </SubscriptionsGate>
            )}
          </SubscriptionPlansGate>
        </TabsContent>
        <TabsContent
          value="usage"
          className={`${CONTENT_WIDTH_CLASS_NAME} pb-4 tablet:pb-5`}
        >
          <SubscriptionsGate skeleton={<UsageSkeleton />}>
            {(subscriptions) => (
              <SubscriptionUsageDashboard
                type={resolveUsageType(subscriptions)}
                onChangeType={handleChangeUsageType}
              />
            )}
          </SubscriptionsGate>
        </TabsContent>
        <TabsContent
          value="payments"
          className={`${CONTENT_WIDTH_CLASS_NAME} flex flex-col gap-4 pb-4 tablet:gap-6 tablet:pb-5`}
        >
          {!isTabletFilter && (
            <>
              <BillingCardList />
              <SubscriptionsGate skeleton={<SubscribedProductSkeleton />}>
                {(subscriptions) => (
                  <SubscribedProductTable subscriptions={subscriptions} />
                )}
              </SubscriptionsGate>
            </>
          )}
          <PaymentHistory />
        </TabsContent>
      </Tabs>
    </>
  );
}
