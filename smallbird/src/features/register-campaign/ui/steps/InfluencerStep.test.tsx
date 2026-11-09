import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { createCampaignDraft } from "@/entities/campaign";

import { useCampaignRegisterStore } from "../../model/store-context";
import { CampaignRegisterProvider } from "../CampaignRegisterProvider";
import { InfluencerStep } from "./InfluencerStep";

beforeEach(() => window.sessionStorage.clear());

function Probe() {
  const influencer = useCampaignRegisterStore(
    (state) => state.draft.influencer,
  );
  return <output data-testid="influencer">{JSON.stringify(influencer)}</output>;
}

const influencer = () =>
  JSON.parse(screen.getByTestId("influencer").textContent ?? "{}") as {
    platform: string | null;
    gender: string | null;
    ageGroups: string[];
    topics: string[];
  };

async function renderStep() {
  const draft = await createCampaignDraft({
    serviceType: "PICK",
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <CampaignRegisterProvider campaignId={draft.campaignIdx}>
        <InfluencerStep />
        <Probe />
      </CampaignRegisterProvider>
    </SWRConfig>,
  );
  await screen.findByRole("group", { name: /플랫폼 선택/ });
  return userEvent.setup();
}

describe("3단계 인플루언서 조건", () => {
  it("플랫폼은 하나만 고르고 같은 값을 다시 눌러도 해제되지 않는다", async () => {
    const user = await renderStep();
    const group = screen.getByRole("group", { name: /플랫폼 선택/ });

    await user.click(within(group).getByRole("radio", { name: "블로그" }));
    await user.click(within(group).getByRole("radio", { name: "유튜브" }));
    await user.click(within(group).getByRole("radio", { name: "유튜브" }));

    expect(influencer().platform).toBe("YOUTUBE");
    expect(within(group).getByRole("radio", { name: "유튜브" })).toBeChecked();
    expect(
      within(group).getByRole("radio", { name: "블로그" }),
    ).not.toBeChecked();
  });

  it("플랫폼 여섯 개가 시안 순서로 있다", async () => {
    await renderStep();
    const group = screen.getByRole("group", { name: /플랫폼 선택/ });

    expect(
      within(group)
        .getAllByRole("radio")
        .map((radio) => radio.textContent),
    ).toEqual(["인스타그램", "블로그", "페이스북", "유튜브", "틱톡", "엑스"]);
  });

  it("성별은 하나만 고른다", async () => {
    const user = await renderStep();
    const group = screen.getByRole("group", { name: /선호 성별/ });

    await user.click(within(group).getByRole("radio", { name: "여성" }));
    await user.click(within(group).getByRole("radio", { name: "전체" }));

    expect(influencer().gender).toBe("ALL");
  });

  it("연령대와 주제는 여러 개를 고르고 다시 눌러 해제하며 정해진 순서로 저장한다", async () => {
    const user = await renderStep();
    const ages = screen.getByRole("group", { name: /선호 연령대/ });
    const topics = screen.getByRole("group", { name: /포스팅 주제/ });

    await user.click(within(ages).getByRole("button", { name: "30대" }));
    await user.click(within(ages).getByRole("button", { name: "10대" }));
    await user.click(within(ages).getByRole("button", { name: "30대" }));
    await user.click(within(topics).getByRole("button", { name: "IT" }));
    await user.click(within(topics).getByRole("button", { name: "뷰티" }));

    expect(influencer().ageGroups).toEqual(["AGE_10S"]);
    expect(influencer().topics).toEqual(["BEAUTY", "IT"]);
  });
});
