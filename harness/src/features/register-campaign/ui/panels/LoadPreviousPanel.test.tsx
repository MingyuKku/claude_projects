import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SWRConfig } from "swr";

import {
  createCampaign,
  createEmptyDraft,
  fetchCampaignDetail,
} from "@/entities/campaign";

import { useRegisterWizardStore } from "../../model/wizard-context";
import { RegisterWizardProvider } from "../RegisterWizardProvider";
import { LoadPreviousPanel } from "./LoadPreviousPanel";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// 표(PC 1440 이상)로 그림.
beforeEach(() => {
  window.sessionStorage.clear();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(min-width: 1440px)" || query === "(min-width: 768px)",
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => vi.unstubAllGlobals());

function NameProbe() {
  const name = useRegisterWizardStore((state) => state.draft.info.name);
  return <output aria-label="캠페인명 값">{name}</output>;
}

async function renderPanel({ hasInput }: { hasInput: boolean }) {
  const { campaignIdx } = await createCampaign({
    serviceType: "PICK",
    productType: "BRAND",
    demo: false,
  });
  const detail = await fetchCampaignDetail(campaignIdx);
  const draft = createEmptyDraft();
  if (hasInput) draft.info.name = "작성 중";
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <RegisterWizardProvider detail={{ ...detail, draft }}>
            <LoadPreviousPanel />
            <NameProbe />
          </RegisterWizardProvider>
        ),
      },
    ],
    { initialEntries: ["/?panel=load-previous"] },
  );
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <RouterProvider router={router} />
    </SWRConfig>,
  );
  return { router };
}

describe("LoadPreviousPanel", () => {
  it("같은 서비스 유형 캠페인만 보이고 1개만 고른다", async () => {
    const user = userEvent.setup();
    await renderPanel({ hasInput: false });

    const vegan = await screen.findByRole("checkbox", {
      name: "초록숲 비건 스킨케어",
    });
    // 모집형 시드(비글로우 선케어 캠페인)는 나오지 않음.
    expect(
      screen.queryByText("비글로우 선케어 캠페인"),
    ).not.toBeInTheDocument();
    const load = screen.getByRole("button", { name: "캠페인 불러오기" });
    expect(load).toBeDisabled();

    await user.click(vegan);
    await user.click(
      screen.getByRole("checkbox", { name: "빅링크 헤어 에센스 리뷰" }),
    );

    expect(vegan).not.toBeChecked();
    expect(load).toBeEnabled();
  });

  it("검색 결과가 없으면 검색어를 넣은 빈 상태를 보인다", async () => {
    const user = userEvent.setup();
    await renderPanel({ hasInput: false });

    await user.type(
      await screen.findByRole("searchbox", { name: "캠페인 검색" }),
      "없는 캠페인{Enter}",
    );

    expect(
      await screen.findByText("‘없는 캠페인’에 대한 검색 결과가 없습니다."),
    ).toBeInTheDocument();
  });

  it("입력한 값이 있으면 덮어쓰기 알럿 뒤 불러와 초안을 다시 채우고 닫는다", async () => {
    const user = userEvent.setup();
    const { router } = await renderPanel({ hasInput: true });

    await user.click(
      await screen.findByRole("checkbox", { name: "초록숲 비건 스킨케어" }),
    );
    await user.click(screen.getByRole("button", { name: "캠페인 불러오기" }));
    const alert = screen.getByRole("alertdialog", { name: "캠페인 불러오기" });
    await user.click(within(alert).getByRole("button", { name: "불러오기" }));

    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "캠페인명 값" }),
      ).toHaveTextContent("초록숲 비건 스킨케어"),
    );
    expect(router.state.location.search).toBe("");
  });
});
