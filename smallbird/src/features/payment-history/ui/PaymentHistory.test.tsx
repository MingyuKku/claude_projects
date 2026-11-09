import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";

import { usePaymentRecords } from "@/entities/subscription";

import { PaymentHistory } from "./PaymentHistory";

import type { PaymentRecord } from "@/entities/subscription";

vi.mock("@/entities/subscription", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  usePaymentRecords: vi.fn(),
}));

function record(
  id: number,
  overrides: Partial<PaymentRecord> = {},
): PaymentRecord {
  return {
    id: `pay-${id}`,
    paidAt: new Date(2026, 9, 28 - id).toISOString(),
    name: `상품 ${id}`,
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
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<PaymentHistory />} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

describe("PaymentHistory", () => {
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

    expect(button()).toHaveAccessibleName("한 번에 볼 개수, 10개");
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
