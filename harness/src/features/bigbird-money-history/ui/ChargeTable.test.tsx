import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import { requestTestDeposit } from "../api/test-deposit-api";
import { ChargeCardList } from "./ChargeCardList";
import { ChargeDetail } from "./ChargeDetail";
import { ChargeTable } from "./ChargeTable";

import type { ChargeRecord } from "../model/charge-types";

vi.mock("../api/test-deposit-api", () => ({ requestTestDeposit: vi.fn() }));

// 거래 상세의 테스트 입금 버튼이 목록 주소 쿼리를 읽어 라우터 안에서 그림.
function renderDetail(record: ChargeRecord) {
  return render(
    <MemoryRouter>
      <ChargeDetail record={record} onClose={vi.fn()} />
    </MemoryRouter>,
  );
}

const paid: ChargeRecord = {
  id: "charge-0",
  serverId: "0",
  type: "charge",
  typeText: "CHARGE",
  requestedAt: new Date("2026-10-23T14:23:18"),
  requestedAtText: "2026-10-23 14:23:18",
  amount: 50000,
  payMethod: "VBANK",
  status: "paid",
  statusText: "DEPOSIT_COMPLETED",
  bankName: "신한은행",
  accountNumber: "1234567890123456",
  holderName: "밍구스",
  completedAt: new Date("2026-10-23T15:00:00"),
  completedAtText: "2026-10-23 15:00:00",
  receiptUrl: "https://iniweb.inicis.com/receipt?tid=1",
};
const pending: ChargeRecord = {
  ...paid,
  id: "charge-1",
  status: "pending",
  statusText: "PENDING",
  completedAt: null,
  completedAtText: "",
  receiptUrl: null,
};
const withdrawal: ChargeRecord = {
  ...paid,
  id: "withdraw-1",
  type: "withdraw",
  typeText: "WITHDRAWAL",
  amount: 800000,
  payMethod: "",
  status: "withdrawn",
  statusText: "WITHDRAWAL_COMPLETED",
  bankName: "국민은행",
  accountNumber: "123456789012",
  holderName: "김빅버드",
  receiptUrl: null,
};

describe("ChargeTable", () => {
  it("열이 구분·일자·금액·은행·계좌 번호·입금자 명·입금 상태·거래명세서·상세 보기 순서다(결제 수단 열 없음)", () => {
    render(
      <ChargeTable records={[paid]} activeId={null} onClickDetail={vi.fn()} />,
    );
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual([
      "구분",
      "일자",
      "금액",
      "은행",
      "계좌 번호",
      "입금자 명",
      "입금 상태",
      "거래명세서",
      "상세 보기",
    ]);
    expect(screen.getByText("충전")).toBeInTheDocument();
    expect(screen.getByText("밍구스")).toBeInTheDocument();
    expect(screen.getByText("신한은행")).toBeInTheDocument();
    expect(screen.getByText("1234567890123456")).toBeInTheDocument();
    expect(screen.queryByText("무통장 입금")).not.toBeInTheDocument();
  });

  it("충전 금액은 + 파랑, 출금 금액은 - 검정이고 모두 w600이다(0원도 +0원)", () => {
    render(
      <ChargeTable
        records={[paid, { ...paid, id: "charge-2", amount: 0 }, withdrawal]}
        activeId={null}
        onClickDetail={vi.fn()}
      />,
    );
    expect(screen.getByText("+50,000원")).toHaveClass(
      "font-semibold",
      "text-primary",
    );
    expect(screen.getByText("+0원")).toHaveClass("text-primary");
    // 출금은 "-" 검정 w600, 구분 배지는 빨강.
    const withdrawn = screen.getByText("-800,000원");
    expect(withdrawn).toHaveClass("font-semibold");
    expect(withdrawn).not.toHaveClass("text-primary");
    expect(screen.getByText("출금")).toHaveAttribute("data-variant", "red");
    expect(screen.getAllByText("충전")[0]).toHaveAttribute(
      "data-variant",
      "blue",
    );
  });

  it("입금 상태는 배지가 아니라 글자로, 서버 코드에 따라 입금 완료·출금 완료·대기 중·미입금 취소로 보인다", () => {
    render(
      <ChargeTable
        records={[
          paid,
          pending,
          withdrawal,
          {
            ...paid,
            id: "charge-2",
            status: "canceled",
            statusText: "DEPOSIT_EXPIRED",
          },
          {
            ...paid,
            id: "charge-3",
            status: null,
            statusText: "WITHDRAWAL_REJECTED",
          },
        ]}
        activeId={null}
        onClickDetail={vi.fn()}
      />,
    );
    for (const text of [
      "입금 완료",
      "출금 완료",
      "대기 중",
      "미입금 취소",
      "WITHDRAWAL_REJECTED",
    ]) {
      const status = screen.getByText(text);
      expect(status).toBeInTheDocument();
      expect(status).not.toHaveAttribute("data-slot", "badge");
    }
  });

  it("오른쪽 패널이 열려 있으면 은행·계좌 번호·입금자 명 열을 숨긴다", () => {
    render(
      <ChargeTable
        records={[paid]}
        activeId="charge-0"
        isPanelOpen
        onClickDetail={vi.fn()}
      />,
    );
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["구분", "일자", "금액", "입금 상태", "거래명세서", "상세 보기"]);
    expect(screen.queryByText("신한은행")).not.toBeInTheDocument();
    expect(screen.queryByText("1234567890123456")).not.toBeInTheDocument();
    expect(screen.queryByText("밍구스")).not.toBeInTheDocument();
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
  it("카드마다 거래명세서·상세 보기 버튼과 구분·일자·금액·은행·계좌 번호·입금자 명·입금 상태 7행 표를 보인다", () => {
    render(<ChargeCardList records={[paid]} onClickDetail={vi.fn()} />);
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(
      ["구분", "일자", "금액", "은행", "계좌 번호", "입금자 명", "입금 상태"],
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "거래명세서",
      "상세 보기",
    ]);
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeEnabled();
  });
});

describe("ChargeDetail", () => {
  it("충전 건은 9행이고 승인 일자 행은 없으며, 값이 없는 입금 완료 일은 -다", () => {
    renderDetail(pending);

    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(
      [
        "충전 구분",
        "입금 요청 일자",
        "충전 금액",
        "결제 수단",
        "은행 명",
        "계좌 번호",
        "입금자 명",
        "입금 완료 일",
        "입금 여부",
      ],
    );
    expect(screen.getByText("입금자 명").nextElementSibling).toHaveTextContent(
      "밍구스",
    );
    // 충전 금액은 부호가 없다.
    expect(screen.getByText("충전 금액").nextElementSibling).toHaveTextContent(
      "50,000원",
    );
    expect(screen.getByText("입금 여부").nextElementSibling).toHaveTextContent(
      "대기 중",
    );
    expect(
      screen.getByText("입금 완료 일").nextElementSibling?.textContent,
    ).toBe("");
    expect(screen.getByText("신한은행")).toBeInTheDocument();
    expect(screen.getByText("1234567890123456")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "거래명세서 받기" }),
    ).toBeDisabled();
  });

  it("출금 건은 출금 라벨 9행이고 처리 방식은 고정 문구, 거래명세서는 끈다", () => {
    renderDetail(withdrawal);

    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(
      [
        "충전 구분",
        "출금 요청 일자",
        "출금 금액",
        "처리 방식",
        "은행 명",
        "계좌 번호",
        "예금주 명",
        "출금 완료 일",
        "출금 여부",
      ],
    );
    expect(screen.getByText("출금")).toHaveAttribute("data-variant", "red");
    expect(screen.getByText("출금 금액").nextElementSibling).toHaveTextContent(
      "800,000원",
    );
    expect(screen.getByText("처리 방식").nextElementSibling).toHaveTextContent(
      "입력된 계좌로 출금",
    );
    expect(screen.getByText("출금 여부").nextElementSibling).toHaveTextContent(
      "출금 완료",
    );
    expect(
      screen.getByRole("button", { name: "거래명세서 받기" }),
    ).toBeDisabled();
  });

  it("결제 완료 건은 거래명세서 받기가 켜진다", () => {
    renderDetail(paid);
    expect(
      screen.getByRole("button", { name: "거래명세서 받기" }),
    ).toBeEnabled();
  });

  it("[개발 서버] 대기 중 무통장 입금 건은 테스트 입금 버튼이 서버 id로 요청한다", async () => {
    vi.mocked(requestTestDeposit).mockResolvedValue({ result: true });
    const user = userEvent.setup();
    renderDetail({ ...pending, id: "charge-850", serverId: "850" });

    await user.click(
      screen.getByRole("button", { name: "[DEV] 입금 처리(테스트)" }),
    );

    expect(requestTestDeposit).toHaveBeenCalledWith("850");
  });

  it("[개발 서버] 입금 완료·출금 건에는 테스트 입금 버튼이 없다", () => {
    renderDetail(paid);
    expect(
      screen.queryByRole("button", { name: "[DEV] 입금 처리(테스트)" }),
    ).not.toBeInTheDocument();
  });
});
