import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";

import {
  usePaymentRecords,
  usePaymentScrollList,
} from "@/entities/subscription";

import { PaymentHistory } from "./PaymentHistory";

import type { PaymentRecord } from "@/entities/subscription";

vi.mock("@/entities/subscription", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  usePaymentRecords: vi.fn(),
  usePaymentScrollList: vi.fn(),
}));

const TABLET_UP_QUERY = "(min-width: 768px)";

// jsdom에는 matchMedia가 없어 기본은 MO 폭. TAB 폭은 tabletUp만 맞게 함.
function stubTabletWidth() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === TABLET_UP_QUERY,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function renderHistory(initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<PaymentHistory />} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

type ScrollList = ReturnType<typeof usePaymentScrollList>;

function scrollList(overrides: Partial<ScrollList> = {}): ScrollList {
  return {
    records: [],
    totalCount: 0,
    hasData: true,
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    isError: false,
    isLoadMoreError: false,
    loadMore: vi.fn(),
    reload: vi.fn(),
    revalidatePages: vi.fn(),
    ...overrides,
  };
}

function record(
  id: number,
  overrides: Partial<PaymentRecord> = {},
): PaymentRecord {
  return {
    id: `pay-${id}`,
    paidAt: new Date(2026, 9, 28 - id).toISOString(),
    name: `상품 ${id}`,
    productType: null,
    billingPeriod: null,
    amount: 99999,
    method: "card",
    cardKind: "credit",
    status: "paid",
    receiptUrl: "https://example.com/receipt",
    ...overrides,
  };
}

function setup(
  records: PaymentRecord[],
  initialEntry = "/",
  totalCount = records.length,
) {
  vi.mocked(usePaymentRecords).mockReturnValue({
    data: { totalCount, records },
    isLoading: false,
    isError: false,
    mutate: vi.fn(),
  });
  vi.mocked(usePaymentScrollList).mockReturnValue(scrollList());
  return renderHistory(initialEntry);
}

describe("PaymentHistory (PC·TAB)", () => {
  beforeEach(stubTabletWidth);
  afterEach(() => vi.unstubAllGlobals());

  it("내역이 없으면 빈 상태를 보이고 쪽 이동을 숨긴다", () => {
    setup([]);
    expect(screen.getByText("구독 결제한 내역이 없습니다.")).toBeVisible();
    expect(
      screen.queryByRole("navigation", { name: "페이지 이동" }),
    ).toBeNull();
  });

  it("한 쪽에 10건만 보이고 쪽 이동이 있다", () => {
    setup(
      Array.from({ length: 10 }, (_, index) => record(index + 1)),
      "/",
      12,
    );
    expect(
      within(screen.getByRole("list", { name: "구독 결제 내역" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(10);
    expect(
      screen.getByRole("navigation", { name: "페이지 이동" }),
    ).toBeVisible();
  });

  it("필터 결과가 없으면 필터 빈 상태 문구를 보인다", () => {
    setup([], "/?status=refunded");
    expect(
      screen.getByText("선택한 조건에 맞는 결과가 없습니다."),
    ).toBeVisible();
    expect(
      screen.queryByRole("navigation", { name: "페이지 이동" }),
    ).toBeNull();
  });

  it("쪽·필터를 서버 요청 조건으로 보낸다", () => {
    setup(
      [record(1)],
      "/?page=2&dateFrom=2026-10-01&dateTo=2026-10-31&method=card&status=paid",
      11,
    );
    expect(usePaymentRecords).toHaveBeenLastCalledWith({
      page: 2,
      size: 10,
      from: "2026-10-01",
      to: "2026-10-31",
      method: "card",
      status: "paid",
    });
  });

  it("주소의 개수(size)를 서버 요청에 쓰고, 선택지에 없는 값은 10으로 본다", () => {
    setup([record(1)], "/?size=30");
    expect(usePaymentRecords).toHaveBeenLastCalledWith(
      expect.objectContaining({ size: 30 }),
    );
    setup([record(1)], "/?size=7");
    expect(usePaymentRecords).toHaveBeenLastCalledWith(
      expect.objectContaining({ size: 10 }),
    );
  });

  it("결제 내역 필터를 결제 주기와 상품 유형 조건으로 나눠 요청하고, 선택지에 없는 값은 거르지 않는다", () => {
    setup([record(1)], "/?item=yearly_pick");
    expect(usePaymentRecords).toHaveBeenLastCalledWith(
      expect.objectContaining({ billingPeriod: "yearly", productType: "pick" }),
    );
    setup([record(1)], "/?item=unknown");
    expect(usePaymentRecords).toHaveBeenLastCalledWith(
      expect.objectContaining({
        billingPeriod: undefined,
        productType: undefined,
      }),
    );
  });

  it("개수 버튼을 누를 때마다 10 → 20 → 30 → 10으로 돌며 그 개수로 다시 요청하고 1쪽으로 돌아간다", async () => {
    const user = setup([record(1)], "/?page=2", 30);
    const button = () =>
      screen.getByRole("button", { name: /^한 번에 볼 개수/ });

    expect(button()).toHaveAccessibleName("한 번에 볼 개수, 10개 보기");
    await user.click(button());
    expect(usePaymentRecords).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, size: 20 }),
    );
    await user.click(button());
    expect(usePaymentRecords).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, size: 30 }),
    );
    await user.click(button());
    expect(usePaymentRecords).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, size: 10 }),
    );
  });

  it("거래명세서는 서버가 준 주소를 새 창으로 연다", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const user = setup([record(1)]);
    await user.click(screen.getByRole("button", { name: "거래명세서" }));

    expect(open).toHaveBeenCalledWith(
      "https://example.com/receipt",
      "_blank",
      "noopener,noreferrer",
    );
    open.mockRestore();
  });
});

describe("PaymentHistory (MO)", () => {
  function setupMobile(list: Partial<ScrollList>, initialEntry = "/") {
    vi.mocked(usePaymentRecords).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      mutate: vi.fn(),
    });
    const scroll = scrollList(list);
    vi.mocked(usePaymentScrollList).mockReturnValue(scroll);
    return { scroll, user: renderHistory(initialEntry) };
  }

  it("쪽 나눔 목록은 읽지 않고, 주소의 쪽을 빼고 조건을 보내 이어 읽는다", () => {
    setupMobile(
      { records: [record(1), record(2)], totalCount: 12, hasMore: true },
      "/?page=2&size=20&status=paid",
    );

    expect(usePaymentRecords).toHaveBeenLastCalledWith(null);
    expect(usePaymentScrollList).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ page: expect.anything() }),
      true,
    );
    expect(usePaymentScrollList).toHaveBeenLastCalledWith(
      expect.objectContaining({ size: 20, status: "paid" }),
      true,
    );
    expect(
      within(screen.getByRole("list", { name: "구독 결제 내역" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("navigation", { name: "페이지 이동" }),
    ).toBeNull();
  });

  it("내역이 없으면 빈 상태를 보인다", () => {
    setupMobile({ totalCount: 0 });
    expect(screen.getByText("구독 결제한 내역이 없습니다.")).toBeVisible();
  });

  it("이어 읽기에 실패하면 먼저 읽은 목록을 두고 다시 시도 버튼으로 다시 읽는다", async () => {
    const { scroll, user } = setupMobile({
      records: [record(1)],
      totalCount: 12,
      hasMore: true,
      isLoadMoreError: true,
    });

    expect(screen.getByRole("list", { name: "구독 결제 내역" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(scroll.reload).toHaveBeenCalledTimes(1);
  });
});
