import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Link, RouterProvider } from "react-router";
import { SWRConfig } from "swr";

import { createEmptyDraft, saveCampaignStep } from "@/entities/campaign";

import { applyDraftDefaults } from "../model/draft-defaults";
import { useSaveBeforeLeave } from "../model/use-save-before-leave";
import {
  useSyncCurrentStep,
  useWizardNavigation,
} from "../model/use-wizard-navigation";
import { useRegisterWizardStore } from "../model/wizard-context";
import { RegisterBottomBar } from "./RegisterBottomBar";
import { RegisterWizardProvider } from "./RegisterWizardProvider";

import type { CampaignDetail } from "@/entities/campaign";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/entities/campaign", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  saveCampaignStep: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(saveCampaignStep).mockReset().mockResolvedValue(undefined);
});

// 1단계를 채운 캠페인. 기본값까지 저장했으면 테스트에서 바꾼 단계만 저장 대상이 됨.
function createDetail({ hasSavedDefaults = true } = {}): CampaignDetail {
  const saved = {
    ...createEmptyDraft(),
    info: {
      name: "봄 체험단",
      brandIdx: 1,
      campaignType: "PRODUCT_DELIVERY" as const,
      startDate: "2026-12-01",
    },
  };
  const draft = hasSavedDefaults
    ? applyDraftDefaults(saved, { hasServerCampaignType: true })
    : saved;
  return {
    campaignIdx: 15,
    campaignCode: "PB-00000000000015",
    serviceType: "PICK",
    productType: "BRAND",
    stage: "DRAFT",
    rawStatus: "DRAFT",
    isDemo: false,
    isDemoCompleted: false,
    rejectReason: null,
    brand: null,
    rawCampaignType: "PRODUCT_DELIVERY",
    endDate: null,
    draft,
    payment: null,
  };
}

// 누를 때마다 다른 값으로 바꿔, 직전에 저장한 값과 같아 보낼 것이 없어지는 일을 막음.
let editCount = 0;

function Harness() {
  const { currentStep, previousStep, goNext, goPrevious, saveTemporarily } =
    useWizardNavigation();
  useSyncCurrentStep();
  useSaveBeforeLeave();
  const pendingSave = useRegisterWizardStore((state) => state.pendingSave);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );
  return (
    <>
      <output aria-label="현재 단계">{currentStep}</output>
      <button
        type="button"
        onClick={() => {
          editCount += 1;
          patchStepDraft("product", { productName: `새 제품 ${editCount}` });
        }}
      >
        값 바꾸기
      </button>
      <Link to="/campaign">나가기</Link>
      <RegisterBottomBar
        variant="default"
        preview={null}
        hasPrevious={previousStep !== null}
        isLastStep={false}
        isDemo={false}
        isPaying={false}
        pendingSave={pendingSave}
        onClickSave={() => void saveTemporarily()}
        onClickPrevious={goPrevious}
        onClickNext={goNext}
      />
    </>
  );
}

function renderWizard(detail = createDetail()) {
  const router = createMemoryRouter(
    [
      {
        path: "/campaign/register/:campaignIdx",
        element: (
          <RegisterWizardProvider detail={detail}>
            <Harness />
          </RegisterWizardProvider>
        ),
      },
      { path: "/campaign", element: <p>캠페인 현황</p> },
    ],
    { initialEntries: ["/campaign/register/15?step=product"] },
  );
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <RouterProvider router={router} />
    </SWRConfig>,
  );
}

/** 저장 요청을 붙잡아 두고, 원할 때 끝내게 함. */
function holdSave() {
  let finish: () => void = () => {};
  vi.mocked(saveCampaignStep).mockImplementationOnce(
    () => new Promise((resolve) => (finish = () => resolve(undefined))),
  );
  return () => finish();
}

describe("단계 이동 저장 중 표시", () => {
  it("'다음'은 저장하는 동안 Loading이고 다른 버튼을 막으며, 다시 눌러도 한 번만 저장한 뒤 옮긴다", async () => {
    const user = userEvent.setup();
    renderWizard();
    const finish = holdSave();

    await user.click(screen.getByRole("button", { name: "값 바꾸기" }));
    await user.click(screen.getByRole("button", { name: /다음/ }));

    const next = screen.getByRole("button", { name: /다음/ });
    expect(next).toHaveAttribute("aria-busy", "true");
    expect(next).toBeDisabled();
    expect(screen.getByRole("button", { name: /이전/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "임시저장" })).toBeDisabled();

    await user.click(next);
    expect(saveCampaignStep).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("현재 단계")).toHaveTextContent("product");

    finish();
    await waitFor(() =>
      expect(screen.getByLabelText("현재 단계")).toHaveTextContent("creator"),
    );
    expect(saveCampaignStep).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /다음/ })).not.toHaveAttribute(
      "aria-busy",
    );
  });

  it("'이전'과 '임시저장'은 누른 버튼에 Loading을 표시한다", async () => {
    const user = userEvent.setup();
    renderWizard();

    let finish = holdSave();
    await user.click(screen.getByRole("button", { name: "값 바꾸기" }));
    await user.click(screen.getByRole("button", { name: "임시저장" }));
    expect(screen.getByRole("button", { name: "임시저장" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("button", { name: /다음/ })).not.toHaveAttribute(
      "aria-busy",
    );
    finish();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "임시저장" }),
      ).not.toBeDisabled(),
    );

    finish = holdSave();
    await user.click(screen.getByRole("button", { name: "값 바꾸기" }));
    await user.click(screen.getByRole("button", { name: /이전/ }));
    expect(screen.getByRole("button", { name: /이전/ })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("button", { name: /다음/ })).toBeDisabled();
    finish();
    await waitFor(() =>
      expect(screen.getByLabelText("현재 단계")).toHaveTextContent(
        "campaign-info",
      ),
    );
  });

  it("'다음' 저장 중에 떠나면 단계를 옮기지 않고, 떠나기 저장이 끝날 때까지 Loading을 유지한 뒤 떠난다", async () => {
    const user = userEvent.setup();
    renderWizard();
    const finishNext = holdSave();
    const finishLeave = holdSave();

    await user.click(screen.getByRole("button", { name: "값 바꾸기" }));
    await user.click(screen.getByRole("button", { name: /다음/ }));
    // 저장 중에 고친 값은 떠나기 저장이 보냄.
    await user.click(screen.getByRole("button", { name: "값 바꾸기" }));
    await user.click(screen.getByRole("link", { name: "나가기" }));

    finishNext();
    await waitFor(() => expect(saveCampaignStep).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("button", { name: /다음/ })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByLabelText("현재 단계")).toHaveTextContent("product");

    finishLeave();
    expect(await screen.findByText("캠페인 현황")).toBeInTheDocument();
  });

  it("열지 않은 단계의 기본 선택은 이동할 때 보내지 않고, 단계를 열고 떠날 때 보낸다", async () => {
    const user = userEvent.setup();
    renderWizard(createDetail({ hasSavedDefaults: false }));
    const savedSteps = () =>
      vi.mocked(saveCampaignStep).mock.calls.map(([, step]) => step);

    await user.click(screen.getByRole("button", { name: "값 바꾸기" }));
    await user.click(screen.getByRole("button", { name: /다음/ }));
    await waitFor(() =>
      expect(screen.getByLabelText("현재 단계")).toHaveTextContent("creator"),
    );
    expect(savedSteps()).toEqual(["product"]);

    await user.click(screen.getByRole("button", { name: /다음/ }));
    await waitFor(() =>
      expect(screen.getByLabelText("현재 단계")).toHaveTextContent(
        "conditions",
      ),
    );
    expect(savedSteps()).toEqual(["product", "creator"]);
  });
});
