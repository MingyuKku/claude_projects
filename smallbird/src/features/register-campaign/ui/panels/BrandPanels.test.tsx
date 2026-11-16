import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { addBrand } from "@/entities/brand";
import { createEmptyDraft } from "@/entities/campaign";

import { useRegisterWizardStore } from "../../model/wizard-context";
import { RegisterWizardProvider } from "../RegisterWizardProvider";
import { AddBrandPanel } from "./AddBrandPanel";
import { BrandManagePanel } from "./BrandManagePanel";

import type * as BrandEntity from "@/entities/brand";
import type { CampaignDetail } from "@/entities/campaign";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/entities/brand", async (importOriginal) => {
  const original = await importOriginal<typeof BrandEntity>();
  return { ...original, addBrand: vi.fn(original.addBrand) };
});

beforeEach(() => {
  window.sessionStorage.clear();
  vi.mocked(toast.error).mockClear();
});

function createDetail(brandIdx: number | null): CampaignDetail {
  const draft = createEmptyDraft();
  draft.info.brandIdx = brandIdx;
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
    rawCampaignType: null,
    endDate: null,
    draft,
    payment: null,
  };
}

function Probe() {
  const brandIdx = useRegisterWizardStore((state) => state.draft.info.brandIdx);
  const { search } = useLocation();
  return (
    <>
      <output aria-label="선택 브랜드">{brandIdx ?? "없음"}</output>
      <output aria-label="주소 쿼리">{search}</output>
    </>
  );
}

function renderPanel(panel: "brands" | "add-brand", brandIdx: number | null) {
  const Panel = panel === "brands" ? BrandManagePanel : AddBrandPanel;
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <RegisterWizardProvider detail={createDetail(brandIdx)}>
            <Panel />
            <Probe />
          </RegisterWizardProvider>
        ),
      },
    ],
    { initialEntries: [`/?panel=${panel}`] },
  );
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <RouterProvider router={router} />
    </SWRConfig>,
  );
}

describe("BrandManagePanel", () => {
  it("등록 브랜드와 개수를 보이고, 지금 고른 브랜드를 지우면 목록에서 빠지고 선택이 빈다", async () => {
    const user = userEvent.setup();
    // 목 저장소 시드: 4 비글로우 · 3 빅링크 코스메틱 · 2 초록숲 · 1 데일리 스튜디오
    renderPanel("brands", 2);

    expect(await screen.findByText("초록숲")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "초록숲 삭제" }));
    const alert = screen.getByRole("alertdialog", { name: "등록 브랜드 삭제" });
    await user.click(within(alert).getByRole("button", { name: "삭제" }));

    await waitFor(() =>
      expect(screen.queryByText("초록숲")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("status", { name: "선택 브랜드" }),
    ).toHaveTextContent("없음");
  });
});

describe("AddBrandPanel", () => {
  it("브랜드명을 넣어야 저장할 수 있고, 저장하면 새 브랜드를 고른 채 닫는다", async () => {
    const user = userEvent.setup();
    renderPanel("add-brand", null);
    const save = screen.getByRole("button", { name: "저장" });
    expect(save).toBeDisabled();

    await user.type(
      screen.getByRole("textbox", { name: /브랜드명/ }),
      "새 브랜드",
    );
    await user.click(save);

    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "주소 쿼리" }),
      ).toBeEmptyDOMElement(),
    );
    expect(
      screen.getByRole("status", { name: "선택 브랜드" }),
    ).not.toHaveTextContent("없음");
  });

  it("저장이 실패하면 토스트를 띄우고 입력값을 그대로 둔다", async () => {
    const user = userEvent.setup();
    vi.mocked(addBrand).mockRejectedValueOnce(new Error("fail"));
    renderPanel("add-brand", null);

    const name = screen.getByRole("textbox", { name: /브랜드명/ });
    await user.type(name, "새 브랜드");
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "저장에 실패하였습니다. 다시 시도해 주세요.",
      ),
    );
    expect(name).toHaveValue("새 브랜드");
    expect(screen.getByRole("status", { name: "주소 쿼리" })).toHaveTextContent(
      "panel=add-brand",
    );
  });

  it("JPG·PNG가 아닌 이미지는 올리지 않고 안내한다", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = renderPanel("add-brand", null);
    const fileInput =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) throw new Error("파일 입력이 없음");

    await user.upload(
      fileInput,
      new File(["x"], "logo.gif", { type: "image/gif" }),
    );

    expect(toast.error).toHaveBeenCalledWith(
      "JPG, PNG 파일만 올릴 수 있습니다.",
    );
  });
});
