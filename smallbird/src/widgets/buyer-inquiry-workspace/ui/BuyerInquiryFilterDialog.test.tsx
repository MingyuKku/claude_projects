import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { BuyerInquiryFilterDialog } from "./BuyerInquiryFilterDialog";

const get = vi.hoisted(() => vi.fn());
vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, serverApiV3: { get } };
});

const campaign = (campaignIdx: number, productName: string, code: string) => ({
  campaignIdx,
  campaignCode: code,
  brandName: "빅버드",
  productName,
  mainImageUrl: null,
  progressStartDate: null,
  progressEndDate: null,
  campaignServiceName: null,
});

// jsdom에는 matchMedia·ResizeObserver·scrollIntoView가 없어 TAB 이상 폭(팝오버)으로 흉내 냄.
beforeEach(() => {
  Element.prototype.scrollIntoView = () => {};
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  get.mockResolvedValue({
    result: true,
    list: [campaign(1, "스킨케어", "Q-1234"), campaign(2, "헤어", "Q-5678")],
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("BuyerInquiryFilterDialog", () => {
  it("캠페인을 캠페인 코드로도 검색한다(REQ-24-0006)", async () => {
    const user = userEvent.setup();
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <BuyerInquiryFilterDialog
          menu="buyer"
          value={{ sourceType: "ALL" }}
          threadUserIdx={5971}
          onApply={() => {}}
        />
      </SWRConfig>,
    );

    await user.click(screen.getByRole("button", { name: "필터" }));
    const [campaignBox] = screen.getAllByRole("combobox");
    await user.click(campaignBox!);
    await user.type(
      await screen.findByPlaceholderText(
        "캠페인명 또는 캠페인 코드를 검색하세요.",
      ),
      "Q-5678",
    );

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: /헤어/ })).toBeInTheDocument();
  });

  it.each([
    ["buyer", "PURCHASER_QUESTION"],
    ["influencer", "INFLUENCER_QUESTION"],
  ] as const)(
    "%s 메뉴는 캠페인·인플루언서 목록을 %s로 받는다",
    async (menu, sourceType) => {
      render(
        <SWRConfig value={{ provider: () => new Map() }}>
          <BuyerInquiryFilterDialog
            menu={menu}
            value={{ sourceType: "ALL", campaignIdx: 1 }}
            threadUserIdx={5971}
            onApply={() => {}}
          />
        </SWRConfig>,
      );

      await waitFor(() => {
        expect(get).toHaveBeenCalledWith("/help/c-client-campaign", {
          params: { sourceType },
        });
        expect(get).toHaveBeenCalledWith("/help/influencer-filter", {
          params: { campaignIdx: 1, sourceType },
        });
      });
    },
  );
});
