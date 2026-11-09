import { render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";

import { createCampaignDraft } from "@/entities/campaign";

import { useCampaignRegisterStore } from "../model/store-context";
import { CampaignRegisterProvider } from "./CampaignRegisterProvider";

beforeEach(() => window.sessionStorage.clear());

function CodeReader() {
  const code = useCampaignRegisterStore((state) => state.draft.campaignCode);
  return <p>{code}</p>;
}

function renderProvider(campaignId: number) {
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <CampaignRegisterProvider
        campaignId={campaignId}
        fallback={<p>불러오는 중</p>}
      >
        <CodeReader />
      </CampaignRegisterProvider>
    </SWRConfig>,
  );
}

describe("CampaignRegisterProvider", () => {
  it("서버 초안을 읽는 동안 fallback을 보이고 끝나면 store를 내려 준다", async () => {
    const { campaignIdx, campaignCode } = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });

    renderProvider(campaignIdx);

    expect(screen.getByText("불러오는 중")).toBeInTheDocument();
    expect(await screen.findByText(campaignCode)).toBeInTheDocument();
  });

  it("store 밖에서 쓰면 알려 준다", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<CodeReader />)).toThrow(
      "must be used inside CampaignRegisterProvider",
    );
    spy.mockRestore();
  });
});
