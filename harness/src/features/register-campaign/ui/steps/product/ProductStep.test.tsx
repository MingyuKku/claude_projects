import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { createEmptyDraft } from "@/entities/campaign";
import { openPostcodeSearch } from "@/shared/lib";

import { useRegisterWizardStore } from "../../../model/wizard-context";
import { RegisterWizardProvider } from "../../RegisterWizardProvider";
import { ProductStep } from "./ProductStep";

import type { CampaignDetail, CampaignType } from "@/entities/campaign";
import type * as SharedLib from "@/shared/lib";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/shared/lib", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedLib>()),
  openPostcodeSearch: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(toast.error).mockClear();
  vi.mocked(openPostcodeSearch).mockReset();
});

function createDetail(campaignType: CampaignType): CampaignDetail {
  const draft = createEmptyDraft();
  draft.info.campaignType = campaignType;
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
    rawCampaignType: campaignType,
    endDate: null,
    draft,
    payment: null,
  };
}

function StoreAddressProbe() {
  const address = useRegisterWizardStore(
    (state) => state.draft.product.storeAddress,
  );
  return <output aria-label="매장 주소 값">{JSON.stringify(address)}</output>;
}

function renderStep(campaignType: CampaignType) {
  return render(
    <RegisterWizardProvider detail={createDetail(campaignType)}>
      <ProductStep />
      <StoreAddressProbe />
    </RegisterWizardProvider>,
  );
}

describe("ProductStep 제품발송형", () => {
  it("반품 회수 여부는 회수 안함으로 시작하고, 회수 있음이면 회수 칸이 나온다", async () => {
    const user = userEvent.setup();
    renderStep("PRODUCT_DELIVERY");

    expect(screen.getByRole("radio", { name: "회수 안함" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(
      screen.queryByText("협찬제품 반품 회수 택배 주소"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "회수 있음" }));

    expect(
      screen.getByText("협찬제품 반품 회수 택배 주소"),
    ).toBeInTheDocument();
  });

  it("대여 상품은 금액이 100만원 이상일 때만 고르고, 금액을 내리면 일반 상품으로 돌아가며 대여 칸을 감춘다", async () => {
    const user = userEvent.setup();
    renderStep("PRODUCT_DELIVERY");
    const price = screen.getByRole("textbox", { name: /협찬제품 금액/ });
    const rental = screen.getByRole("radio", { name: "대여 상품" });
    expect(rental).toBeDisabled();

    await user.type(price, "1500000");
    expect(price).toHaveValue("1,500,000");
    await user.click(rental);
    expect(screen.getByText("대여 상품 회수 택배 주소")).toBeInTheDocument();

    await user.clear(price);
    await user.type(price, "900000");

    expect(screen.getByRole("radio", { name: "일반 상품" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(rental).toBeDisabled();
    expect(
      screen.queryByText("대여 상품 회수 택배 주소"),
    ).not.toBeInTheDocument();
  });

  it("연락처는 숫자와 하이픈만 받는다", async () => {
    const user = userEvent.setup();
    renderStep("PRODUCT_DELIVERY");
    await user.click(screen.getByRole("radio", { name: "회수 있음" }));

    const contact = screen.getByRole("textbox", { name: /반품 회수 연락처/ });
    await user.type(contact, "010-12ab34");

    expect(contact).toHaveValue("010-1234");
  });
});

describe("ProductStep 매장방문형", () => {
  it("쿠폰 인증번호는 숫자 4자리이고 첫 자리 0을 받지 않는다", async () => {
    const user = userEvent.setup();
    renderStep("STORE_VISIT");

    const coupon = screen.getByRole("textbox", { name: /방문 쿠폰 인증번호/ });
    await user.type(coupon, "0a12345");

    expect(coupon).toHaveValue("1234");
  });

  it("주소 검색에서 고른 주소를 읽기 전용 칸에 넣고 상세 주소는 직접 입력한다", async () => {
    const user = userEvent.setup();
    vi.mocked(openPostcodeSearch).mockResolvedValue({
      zonecode: "13529",
      address: "경기 성남시 분당구 판교역로 166",
    });
    renderStep("STORE_VISIT");

    await user.click(screen.getByRole("button", { name: "주소 검색" }));
    await user.type(
      screen.getByRole("textbox", { name: "상세 주소 입력" }),
      "1층",
    );

    expect(screen.getByRole("textbox", { name: /매장 주소/ })).toHaveValue(
      "경기 성남시 분당구 판교역로 166",
    );
    expect(
      screen.getByRole("status", { name: "매장 주소 값" }),
    ).toHaveTextContent(
      JSON.stringify({
        zonecode: "13529",
        address: "경기 성남시 분당구 판교역로 166",
        detail: "1층",
      }),
    );
  });

  it("주소 검색을 불러오지 못하면 실패 토스트를 띄운다", async () => {
    const user = userEvent.setup();
    vi.mocked(openPostcodeSearch).mockRejectedValue(new Error("load"));
    renderStep("STORE_VISIT");

    await user.click(screen.getByRole("button", { name: "주소 검색" }));

    expect(toast.error).toHaveBeenCalledWith(
      "주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  });
});

describe("ProductStep 기자단형", () => {
  it("입력 칸 없이 안내만 보인다", () => {
    renderStep("PRESS");

    expect(
      screen.getByText("기자단형은 별도의 협찬 정보 입력이 없습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
