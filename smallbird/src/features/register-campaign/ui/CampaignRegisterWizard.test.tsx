import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { SWRConfig } from "swr";

import { createCampaignDraft, fetchCampaignDraft } from "@/entities/campaign";

import { useCampaignRegisterStore } from "../model/store-context";
import { CampaignRegisterProvider } from "./CampaignRegisterProvider";
import { CampaignRegisterWizard } from "./CampaignRegisterWizard";
import { CampaignStepSidebar } from "./CampaignStepSidebar";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

beforeEach(() => {
  window.sessionStorage.clear();
  toast.success.mockClear();
  toast.error.mockClear();
});

function Location() {
  const { search } = useLocation();
  return <p data-testid="search">{search}</p>;
}

// 단계 화면이 아직 없어서, 1단계를 채우는 버튼으로 대신함.
function FillStepOne() {
  const patch = useCampaignRegisterStore((state) => state.patchCampaignInfo);
  return (
    <button
      onClick={() =>
        patch({
          name: "봄 체험",
          brandIdx: 1,
          startDate: "2026-12-01",
        })
      }
    >
      1단계 채우기
    </button>
  );
}

function ChooseType() {
  const change = useCampaignRegisterStore((state) => state.changeCampaignType);
  return <button onClick={() => change("PRESS")}>기자단형 고르기</button>;
}

async function renderWizard(initialStep = "campaign-info") {
  const draft = await createCampaignDraft({
    serviceType: "PICK",
    productType: "BRAND",
  });
  const onPay = vi.fn();
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <MemoryRouter initialEntries={[`/?step=${initialStep}`]}>
        <CampaignRegisterProvider campaignId={draft.campaignIdx}>
          <CampaignStepSidebar />
          <FillStepOne />
          <ChooseType />
          <CampaignRegisterWizard onPay={onPay} />
          <Location />
        </CampaignRegisterProvider>
      </MemoryRouter>
    </SWRConfig>,
  );
  await screen.findByRole("heading", { level: 2 });
  return { draft, onPay, user: userEvent.setup() };
}

const step = () => screen.getByTestId("search").textContent;
const sidebar = () =>
  screen.getByRole("navigation", { name: "캠페인 등록 단계" });
const sidebarItem = (name: RegExp) =>
  within(sidebar()).getByRole("button", { name });
const footerNext = () => screen.getByRole("button", { name: "다음" });

describe("캠페인 등록 마법사 이동", () => {
  it("현재 단계 제목을 보이고 사이드바에 8단계가 나온다", async () => {
    await renderWizard();

    expect(
      screen.getByRole("heading", { level: 2, name: "캠페인 정보 입력" }),
    ).toBeInTheDocument();
    expect(within(sidebar()).getAllByRole("button")).toHaveLength(8);
    expect(sidebarItem(/캠페인 정보 입력/)).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("필수값이 비어 있으면 다음을 눌러도 알럿만 뜨고 단계는 그대로다", async () => {
    const { user } = await renderWizard();

    await user.click(footerNext());

    const alert = await screen.findByRole("alertdialog");
    expect(alert).toHaveTextContent("필수 항목 미입력");
    expect(alert).toHaveTextContent(
      "해당 페이지의 모든 항목을 입력하지 않을시 캠페인 등록이 불가능합니다.",
    );
    expect(step()).toBe("?step=campaign-info");
    await user.click(within(alert).getByRole("button", { name: "취소" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(step()).toBe("?step=campaign-info");
  });

  it("필수값을 채우면 저장한 뒤 다음 단계로 간다", async () => {
    const { draft, user } = await renderWizard();
    await user.click(screen.getByRole("button", { name: "1단계 채우기" }));
    await user.click(screen.getByRole("button", { name: "기자단형 고르기" }));

    await user.click(footerNext());

    await waitFor(() => expect(step()).toBe("?step=product"));
    expect(
      (await fetchCampaignDraft(draft.campaignIdx)).campaignInfo.name,
    ).toBe("봄 체험");
    // 1단계 화면에는 이전 버튼이 없었고, 2단계부터 생긴다.
    expect(screen.getByRole("button", { name: "이전" })).toBeInTheDocument();
  });

  it("이전은 검사 없이 저장만 하고 앞 단계로 간다", async () => {
    const { user } = await renderWizard("influencer");

    await user.click(screen.getByRole("button", { name: "이전" }));

    await waitFor(() => expect(step()).toBe("?step=product"));
  });

  it("사이드바로 검사 없이 아무 단계로 건너뛰고, 건너뛴 필수 단계는 경고가 뜬다", async () => {
    const { user } = await renderWizard();

    await user.click(sidebarItem(/캠페인 소개서 작성/));

    await waitFor(() => expect(step()).toBe("?step=intro"));
    // 1단계는 가 봤는데 비어 있고, 4단계는 선택 단계라 경고가 없다.
    await waitFor(() => {
      expect(sidebarItem(/캠페인 정보 입력/)).toHaveClass("border-destructive");
    });
    expect(sidebarItem(/제품 정보 입력/)).toHaveClass("border-destructive");
    expect(sidebarItem(/부가서비스/)).not.toHaveClass("border-destructive");
    expect(sidebarItem(/캠페인 소개서 작성/)).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("마지막 단계의 결제하기는 비어 있는 단계가 있으면 알럿을 띄우고, 확인하면 첫 미완 단계로 보낸다", async () => {
    const { user, onPay } = await renderWizard("payment");

    await user.click(screen.getByRole("button", { name: "결제하기" }));

    const alert = await screen.findByRole("alertdialog");
    expect(alert).toHaveTextContent(
      "입력하지 않은 항목이 있어 결제할 수 없습니다. 표시된 단계의 필수 항목을 모두 입력해 주세요.",
    );
    // 결제 알럿은 확인만 둔다.
    expect(within(alert).queryByRole("button", { name: "취소" })).toBeNull();
    await user.click(within(alert).getByRole("button", { name: "확인" }));

    await waitFor(() => expect(step()).toBe("?step=campaign-info"));
    expect(onPay).not.toHaveBeenCalled();
  });

  it("임시저장을 누르면 저장하고 토스트로 알린다", async () => {
    const { draft, user } = await renderWizard();
    await user.click(screen.getByRole("button", { name: "1단계 채우기" }));

    await user.click(screen.getAllByRole("button", { name: "임시저장" })[0]!);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("임시저장되었습니다."),
    );
    expect(
      (await fetchCampaignDraft(draft.campaignIdx)).campaignInfo.name,
    ).toBe("봄 체험");
  });

  it("단계를 열면 가 본 단계로 서버에 남는다", async () => {
    const { draft, user } = await renderWizard("influencer");

    await user.click(screen.getAllByRole("button", { name: "임시저장" })[0]!);

    await waitFor(async () =>
      expect(
        (await fetchCampaignDraft(draft.campaignIdx)).visitedSteps,
      ).toContain("INFLUENCER"),
    );
  });
});

describe("모바일 단계 목록 드로어", () => {
  it("≡로 열고 단계를 고르면 이동하고 닫힌다", async () => {
    const { user } = await renderWizard();

    await user.click(screen.getByRole("button", { name: "단계 목록 열기" }));
    const drawer = await screen.findByRole("dialog");
    await user.click(
      within(drawer).getByRole("button", { name: /진행 조건 설정/ }),
    );

    await waitFor(() => expect(step()).toBe("?step=conditions"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
