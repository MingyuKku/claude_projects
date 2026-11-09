import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { createCampaignDraft } from "@/entities/campaign";

import { useCampaignRegisterStore } from "../../model/store-context";
import { CampaignRegisterProvider } from "../CampaignRegisterProvider";
import { AddOnsNotice } from "./AddOnsNotice";
import { AddOnsStep } from "./AddOnsStep";

beforeEach(() => window.sessionStorage.clear());

function Probe() {
  const addOns = useCampaignRegisterStore((state) => state.draft.addOns);
  return <output data-testid="add-ons">{addOns.join(",")}</output>;
}

async function renderStep(serviceType: "PICK" | "RECRUIT") {
  const draft = await createCampaignDraft({
    serviceType,
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <CampaignRegisterProvider campaignId={draft.campaignIdx}>
        <AddOnsNotice />
        <AddOnsStep />
        <Probe />
      </CampaignRegisterProvider>
    </SWRConfig>,
  );
  await screen.findByTestId("add-ons");
  return userEvent.setup();
}

const addOns = () => screen.getByTestId("add-ons").textContent;

describe("4단계 부가서비스", () => {
  it("선택사항 안내 박스를 보인다", async () => {
    await renderStep("RECRUIT");

    expect(
      screen.getByText("부가서비스는 선택사항입니다."),
    ).toBeInTheDocument();
  });

  it("모집형은 카드 세 장과 가격을 보인다", async () => {
    await renderStep("RECRUIT");

    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(3);
    expect(screen.getByText("10,000원")).toBeInTheDocument();
    expect(screen.getAllByText("모집 인플루언서 당 5,000원")).toHaveLength(2);
  });

  it("PICK형은 AI 포스팅 가이드 하나뿐이다", async () => {
    await renderStep("PICK");

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /AI 포스팅 가이드/ }),
    ).toBeInTheDocument();
  });

  it("카드를 눌러 켜고 끄며 정해진 순서로 저장한다", async () => {
    const user = await renderStep("RECRUIT");

    await user.click(screen.getByRole("button", { name: /AI 영수증 리뷰/ }));
    await user.click(screen.getByRole("button", { name: /AI 포스팅 가이드/ }));
    expect(addOns()).toBe("AI_POSTING_GUIDE,AI_RECEIPT_REVIEW");
    expect(
      screen.getByRole("button", { name: /AI 포스팅 가이드/ }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /AI 포스팅 가이드/ }));
    expect(addOns()).toBe("AI_RECEIPT_REVIEW");
  });
});
