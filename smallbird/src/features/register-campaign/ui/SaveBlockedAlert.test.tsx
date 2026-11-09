import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { SWRConfig } from "swr";

import { createCampaignDraft } from "@/entities/campaign";

import { reloadPage } from "../model/reload-page";
import { useCampaignRegisterStore } from "../model/store-context";
import { CampaignRegisterProvider } from "./CampaignRegisterProvider";
import { SaveBlockedAlert } from "./SaveBlockedAlert";

import type { SaveBlockedReason } from "../model/store";

vi.mock("../model/reload-page", () => ({ reloadPage: vi.fn() }));

beforeEach(() => {
  window.sessionStorage.clear();
  vi.mocked(reloadPage).mockClear();
});

function Block({ reason }: { reason: SaveBlockedReason }) {
  const setReason = useCampaignRegisterStore(
    (state) => state.setSaveBlockedReason,
  );
  return <button onClick={() => setReason(reason)}>저장 막기</button>;
}

function Location() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{`${pathname}${search}`}</output>;
}

async function renderAlert(reason: SaveBlockedReason) {
  const draft = await createCampaignDraft({
    serviceType: "PICK",
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <MemoryRouter initialEntries={["/campaign/register/1?step=product"]}>
        <CampaignRegisterProvider campaignId={draft.campaignIdx}>
          <Block reason={reason} />
          <SaveBlockedAlert />
          <Location />
        </CampaignRegisterProvider>
      </MemoryRouter>
    </SWRConfig>,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "저장 막기" }));
  return { draft, user };
}

describe("저장이 막혔을 때 안내 알럿", () => {
  it("막히지 않았으면 알럿이 없다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <MemoryRouter>
          <CampaignRegisterProvider campaignId={draft.campaignIdx}>
            <p>준비됨</p>
            <SaveBlockedAlert />
          </CampaignRegisterProvider>
        </MemoryRouter>
      </SWRConfig>,
    );

    await screen.findByText("준비됨");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("수정할 수 없는 상태면 안내하고 확인하면 등록 내역으로 교체 이동한다", async () => {
    const { draft, user } = await renderAlert("NOT_EDITABLE");

    const alert = await screen.findByRole("alertdialog");
    expect(alert).toHaveTextContent("수정할 수 없는 상태입니다");

    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      `/campaign/${draft.campaignIdx}`,
    );
    expect(reloadPage).not.toHaveBeenCalled();
  });

  it("다른 곳에서 먼저 수정됐으면 안내하고 확인하면 화면을 새로 불러온다", async () => {
    const { user } = await renderAlert("VERSION_CONFLICT");

    const alert = await screen.findByRole("alertdialog");
    expect(alert).toHaveTextContent("다른 곳에서 수정되었습니다");

    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(reloadPage).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/campaign/register/1?step=product",
    );
  });
});
