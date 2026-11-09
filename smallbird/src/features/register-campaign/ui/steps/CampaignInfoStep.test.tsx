import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import { createCampaignDraft } from "@/entities/campaign";

import { useCampaignRegisterStore } from "../../model/store-context";
import { CampaignRegisterProvider } from "../CampaignRegisterProvider";
import { CampaignInfoStep } from "./CampaignInfoStep";

// jsdom에는 Radix Select·Popover가 쓰는 포인터 캡처·스크롤·크기 관찰 API가 없음.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

// jsdom에는 matchMedia가 없음. TAB 폭(768 이상)을 흉내 내서 브랜드 메뉴가 시트가 아닌 팝오버로 열리게 함.
beforeEach(() => {
  window.sessionStorage.clear();
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// 다른 단계의 값을 넣어 유형 변경 확인 알럿을 시험하려고 store를 읽고 쓰는 도구.
function Probe() {
  const draft = useCampaignRegisterStore((state) => state.draft);
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);
  return (
    <>
      <output data-testid="draft">
        {JSON.stringify({
          name: draft.campaignInfo.name,
          type: draft.campaignInfo.campaignType,
          brandIdx: draft.campaignInfo.brandIdx,
          startDate: draft.campaignInfo.startDate,
          productName: draft.product.productName,
        })}
      </output>
      <button onClick={() => patchProduct({ productName: "세트" })}>
        제품명 입력
      </button>
    </>
  );
}

const state = () =>
  JSON.parse(screen.getByTestId("draft").textContent ?? "{}") as Record<
    string,
    unknown
  >;

async function renderStep() {
  const draft = await createCampaignDraft({
    serviceType: "PICK",
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <MemoryRouter>
        <CampaignRegisterProvider campaignId={draft.campaignIdx}>
          <CampaignInfoStep />
          <Probe />
        </CampaignRegisterProvider>
      </MemoryRouter>
    </SWRConfig>,
  );
  await screen.findByText(draft.campaignCode);
  return { draft, user: userEvent.setup() };
}

describe("1단계 캠페인 정보", () => {
  it("캠페인 코드는 서버 값을 읽기 전용 텍스트로 보인다", async () => {
    const { draft } = await renderStep();

    expect(screen.getByText("캠페인 코드")).toBeInTheDocument();
    expect(screen.getByText(draft.campaignCode).tagName).toBe("P");
  });

  it("캠페인명을 입력하면 초안에 반영된다", async () => {
    const { user } = await renderStep();

    await user.type(
      screen.getByRole("textbox", { name: /캠페인명/ }),
      "봄 체험",
    );

    expect(state().name).toBe("봄 체험");
  });

  it("캠페인 유형 4가지를 단일 선택하고, 선택한 값을 다시 눌러도 해제하지 않는다", async () => {
    const { user } = await renderStep();
    const group = screen.getByRole("group", { name: /캠페인 유형/ });

    expect(
      within(group)
        .getAllByRole("radio")
        .map((r) => r.textContent),
    ).toEqual(["제품발송형", "기자단형", "매장방문형", "구매리뷰형"]);
    await user.click(within(group).getByRole("radio", { name: "기자단형" }));
    expect(state().type).toBe("PRESS");

    await user.click(within(group).getByRole("radio", { name: "기자단형" }));
    expect(state().type).toBe("PRESS");
    expect(
      within(group).getByRole("radio", { name: "기자단형" }),
    ).toBeChecked();

    await user.click(within(group).getByRole("radio", { name: "매장방문형" }));
    expect(state().type).toBe("STORE_VISIT");
    expect(
      within(group).getByRole("radio", { name: "기자단형" }),
    ).not.toBeChecked();
  });

  it("2단계에 입력한 값이 없으면 유형을 바로 바꾼다", async () => {
    const { user } = await renderStep();
    await user.click(screen.getByRole("radio", { name: "기자단형" }));

    await user.click(screen.getByRole("radio", { name: "매장방문형" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(state().type).toBe("STORE_VISIT");
  });

  it("2단계에 입력한 값이 있으면 확인 알럿을 띄우고, 취소하면 그대로, 변경하면 비워진다", async () => {
    const { user } = await renderStep();
    await user.click(screen.getByRole("radio", { name: "제품발송형" }));
    await user.click(screen.getByRole("button", { name: "제품명 입력" }));

    await user.click(screen.getByRole("radio", { name: "매장방문형" }));
    const alert = await screen.findByRole("alertdialog");
    expect(alert).toHaveTextContent("캠페인 유형 변경");
    expect(alert).toHaveTextContent(
      "캠페인 유형을 바꾸면 제품 정보 입력과 유형별 진행 조건에 입력한 내용이 초기화됩니다. 바꿀까요?",
    );
    await user.click(within(alert).getByRole("button", { name: "취소" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(state()).toMatchObject({
      type: "PRODUCT_DELIVERY",
      productName: "세트",
    });

    await user.click(screen.getByRole("radio", { name: "매장방문형" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "변경하기",
      }),
    );

    expect(state()).toMatchObject({ type: "STORE_VISIT", productName: null });
  });

  it("브랜드 목록에서 브랜드를 고른다", async () => {
    const { user } = await renderStep();

    await user.click(screen.getByRole("combobox", { name: /브랜드명/ }));
    await user.click(await screen.findByRole("option", { name: "초록숲" }));

    expect(state().brandIdx).toBe(2);
    expect(
      screen.getByRole("combobox", { name: /브랜드명/ }),
    ).toHaveTextContent("초록숲");
  });

  it("날짜를 고르기 전에는 시작 일자 1칸이고, 고른 뒤에는 캠페인 기간과 자동 종료일 2칸이 된다", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 10, 15, 12) });
    const { user } = await renderStep();
    expect(screen.getByText("캠페인 희망 시작 일자")).toBeInTheDocument();
    expect(
      screen.getByText("종료 날짜는 자동으로 30일 후로 세팅됩니다."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /캠페인 기간/ })).toBeNull();

    await user.click(
      screen.getByRole("button", { name: /캠페인 희망 시작 일자/ }),
    );
    await user.click(await screen.findByRole("button", { name: /20일/ }));

    expect(state().startDate).toBe("2026-11-20");
    expect(await screen.findByText("캠페인 기간")).toBeInTheDocument();
    expect(screen.queryByText("캠페인 희망 시작 일자")).toBeNull();
    expect(
      screen.getByRole("textbox", { name: /캠페인 기간/ }),
    ).toHaveTextContent("2026.12.20");
  });

  it("캘린더는 오늘 이전 날짜만 막는다", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 10, 15, 12) });
    const { user } = await renderStep();

    await user.click(
      screen.getByRole("button", { name: /캠페인 희망 시작 일자/ }),
    );

    expect(await screen.findByRole("button", { name: /14일/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /15일/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /16일/ })).toBeEnabled();
  });
});
