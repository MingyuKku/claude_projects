import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChargeCardList } from "./ChargeCardList";
import { ChargeDetail } from "./ChargeDetail";
import { ChargeTable } from "./ChargeTable";

import type { ChargeRecord } from "../model/charge-types";

const paid: ChargeRecord = {
  id: "0",
  requestedAt: new Date("2026-10-23T14:23:18"),
  requestedAtText: "2026-10-23 14:23:18",
  amount: 50000,
  payMethod: "VBank",
  status: "paid",
  statusText: "결제완료",
  bankName: "신한은행",
  accountNumber: "1234567890123456",
  depositedAt: new Date("2026-10-23T15:00:00"),
  depositedAtText: "2026-10-23 15:00:00",
  receiptUrl: "https://iniweb.inicis.com/receipt?tid=1",
};
const pending: ChargeRecord = {
  ...paid,
  id: "1",
  status: "pending",
  statusText: "대기중",
  depositedAt: null,
  depositedAtText: "-",
  receiptUrl: null,
};

describe("ChargeTable", () => {
  it("열이 충전 일자·충전 요청 금액·결제 수단·입금 상태·거래명세서·상세 보기 순서다", () => {
    render(
      <ChargeTable records={[paid]} activeId={null} onClickDetail={vi.fn()} />,
    );
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual([
      "충전 일자",
      "충전 요청 금액",
      "결제 수단",
      "입금 상태",
      "거래명세서",
      "상세 보기",
    ]);
    expect(screen.getByText("50,000원")).toBeInTheDocument();
    expect(screen.getByText("무통장 입금")).toBeInTheDocument();
    expect(screen.getByText("결제 완료")).toBeInTheDocument();
  });

  it("거래명세서는 결제 완료 건만 켜고 대기 중 건은 끈다", () => {
    render(
      <ChargeTable
        records={[paid, pending]}
        activeId={null}
        onClickDetail={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("button", { name: "거래명세서" });
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeDisabled();
  });

  it("거래명세서를 누르면 새 창으로 연다", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const user = userEvent.setup();
    render(
      <ChargeTable records={[paid]} activeId={null} onClickDetail={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "거래명세서" }));

    expect(open).toHaveBeenCalledWith(
      "https://iniweb.inicis.com/receipt?tid=1",
      "_blank",
      "noopener,noreferrer",
    );
    open.mockRestore();
  });

  it("상세 보기 버튼을 누르면 그 행으로 알린다", async () => {
    const user = userEvent.setup();
    const onClickDetail = vi.fn();
    render(
      <ChargeTable
        records={[paid, pending]}
        activeId={null}
        onClickDetail={onClickDetail}
      />,
    );
    const row = screen.getAllByRole("row")[2];
    if (!row) throw new Error("행이 없다");

    await user.click(within(row).getByRole("button", { name: "상세 보기" }));

    expect(onClickDetail).toHaveBeenCalledWith(pending);
  });
});

describe("ChargeCardList", () => {
  it("카드마다 상세 보기·거래명세서 버튼과 4행 표를 보인다", () => {
    render(<ChargeCardList records={[paid]} onClickDetail={vi.fn()} />);
    expect(screen.getAllByRole("term")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "상세 보기" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /거래명세서/ })).toBeEnabled();
  });
});

describe("ChargeDetail", () => {
  it("모든 기기에서 8행이고 값이 없는 일자는 -다", () => {
    render(<ChargeDetail record={pending} onClose={vi.fn()} />);

    expect(screen.getAllByRole("term")).toHaveLength(8);
    expect(screen.getByText("승인 일자").nextElementSibling).toHaveTextContent(
      "-",
    );
    expect(
      screen.getByText("입금 완료 일").nextElementSibling,
    ).toHaveTextContent("-");
    expect(screen.getByText("신한은행")).toBeInTheDocument();
    expect(screen.getByText("1234567890123456")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "거래명세서 받기" }),
    ).toBeDisabled();
  });

  it("결제 완료 건은 거래명세서 받기가 켜진다", () => {
    render(<ChargeDetail record={paid} onClose={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "거래명세서 받기" }),
    ).toBeEnabled();
  });
});
