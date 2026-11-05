import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UsageCardList } from "./UsageCardList";
import { UsageDetail } from "./UsageDetail";
import { UsageTable } from "./UsageTable";

import type { UsageRecord } from "../model/usage-types";

const deduction: UsageRecord = {
  id: "0",
  type: "use",
  typeText: "사용",
  usedAt: new Date("2026-10-23T14:23:18"),
  usedAtText: "2026-10-23 14:23:18",
  campaignName: "2026 여름 시즌 캠핑 용품 신제품 리뷰 캠페인",
  campaignCode: "CP0001",
  campaignImageUrl: null,
  campaignType: "pick",
  campaignTypeText: "pick",
  usageDetail: "contractPick",
  usageDetailText: "인플루언서 계약비용(PICK형)",
  amount: -50000,
  contractTarget: { name: "김하루", influencerId: "haru_beauty" },
  remainingAmount: 1250000,
};
const refund: UsageRecord = {
  ...deduction,
  id: "1",
  type: "refund",
  typeText: "환급",
  campaignCode: "-",
  amount: 30000,
  remainingAmount: null,
};
const charge: UsageRecord = {
  ...deduction,
  id: "2",
  type: "charge",
  typeText: "충전",
  campaignName: "",
  campaignCode: "",
  campaignType: null,
  campaignTypeText: "",
  usageDetail: null,
  usageDetailText: "",
  amount: 100000,
  contractTarget: null,
};
const withdrawal: UsageRecord = {
  ...charge,
  id: "3",
  type: "withdraw",
  typeText: "출금",
  amount: -100000,
};

describe("UsageTable", () => {
  it("열이 구분·일자·캠페인 명·내역·금액·잔액·상세 보기 순서다(캠페인 코드 열 없음)", () => {
    render(
      <UsageTable
        records={[deduction]}
        activeId={null}
        onClickDetail={vi.fn()}
      />,
    );

    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent);
    expect(headers).toEqual([
      "구분",
      "일자",
      "캠페인 명",
      "내역",
      "금액",
      "잔액",
      "상세 보기",
    ]);
    expect(screen.getByText("1,250,000원")).toBeInTheDocument();
    expect(screen.queryByText("CP0001")).not.toBeInTheDocument();
  });

  it("구분 배지는 사용(회색)·환급(초록)·충전(파랑)·출금(빨강)이고 그 밖의 서버 값은 값 그대로 회색이다", () => {
    render(
      <UsageTable
        records={[
          deduction,
          refund,
          { ...charge, id: "2" },
          { ...withdrawal, id: "3" },
          { ...deduction, id: "4", type: null, typeText: "환불" },
        ]}
        activeId={null}
        onClickDetail={vi.fn()}
      />,
    );

    expect(screen.getByText("사용")).toHaveAttribute("data-variant", "gray");
    expect(screen.getByText("환급")).toHaveAttribute("data-variant", "green");
    expect(screen.getByText("충전")).toHaveAttribute("data-variant", "blue");
    expect(screen.getByText("출금")).toHaveAttribute("data-variant", "red");
    expect(screen.getByText("환불")).toHaveAttribute("data-variant", "gray");
  });

  it("사용은 검정 -금액, 환급은 파랑 +금액이고 모두 w600이다", () => {
    render(
      <UsageTable
        records={[deduction, refund]}
        activeId={null}
        onClickDetail={vi.fn()}
      />,
    );

    const deducted = screen.getByText("-50,000원");
    expect(deducted).toHaveClass("font-semibold");
    expect(deducted).not.toHaveClass("text-primary", "text-destructive");
    expect(screen.getByText("+30,000원")).toHaveClass(
      "font-semibold",
      "text-primary",
    );
  });

  it("옆 패널이 열려 있으면 캠페인 명·잔액 열을 숨기고 내역 열은 남긴다", () => {
    render(
      <UsageTable
        records={[deduction]}
        activeId="0"
        isPanelOpen
        onClickDetail={vi.fn()}
      />,
    );

    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["구분", "일자", "내역", "금액", "상세 보기"]);
    expect(
      screen.queryByText("2026 여름 시즌 캠핑 용품 신제품 리뷰 캠페인"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("1,250,000원")).not.toBeInTheDocument();
  });

  it("상세 보기 버튼을 누르면 그 행의 id로 알린다", async () => {
    const user = userEvent.setup();
    const onClickDetail = vi.fn();
    render(
      <UsageTable
        records={[deduction, refund]}
        activeId={null}
        onClickDetail={onClickDetail}
      />,
    );

    const row = screen.getAllByRole("row")[2];
    if (!row) throw new Error("행이 없다");
    await user.click(within(row).getByRole("button", { name: "상세 보기" }));

    expect(onClickDetail).toHaveBeenCalledWith(refund);
  });

  it("emptyContent가 있으면 행 대신 그린다", () => {
    render(
      <UsageTable
        records={[]}
        activeId={null}
        onClickDetail={vi.fn()}
        emptyContent={<p>내역 없음</p>}
      />,
    );
    expect(screen.getByText("내역 없음")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("UsageCardList", () => {
  it("구분·일자·캠페인 명·내역·금액·잔액 6행이고 값이 없는 항목도 -로 둔다", () => {
    render(<UsageCardList records={[refund]} onClickDetail={vi.fn()} />);

    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(
      ["구분", "일자", "캠페인 명", "내역", "금액", "잔액"],
    );
    expect(screen.getByText("잔액").nextElementSibling).toHaveTextContent("-");
  });

  it("상세 보기 버튼을 누르면 그 카드로 알린다", async () => {
    const user = userEvent.setup();
    const onClickDetail = vi.fn();
    render(
      <UsageCardList
        records={[deduction, refund]}
        onClickDetail={onClickDetail}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: "상세 보기" });
    await user.click(buttons[1] as HTMLElement);

    expect(onClickDetail).toHaveBeenCalledWith(refund);
  });
});

describe("UsageDetail", () => {
  it("구분 배지부터 사용 후 잔액까지 9행이고 계약 대상은 사용 내역과 금액 사이다", () => {
    render(<UsageDetail record={deduction} onClose={vi.fn()} />);

    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(
      [
        "구분",
        "사용 일자",
        "캠페인 명",
        "캠페인 유형",
        "캠페인 코드",
        "사용 내역",
        "계약 대상",
        "사용 금액",
        "사용 후 잔액",
      ],
    );
    expect(screen.getByText("-50,000원")).toHaveClass("font-semibold");
  });

  it("코드를 번역 문구로 보이고 계약 대상은 이름과 @아이디를 보인다", () => {
    render(<UsageDetail record={deduction} onClose={vi.fn()} />);

    expect(screen.getByText("PICK형")).toBeInTheDocument();
    expect(screen.getByText("인플루언서 계약비용(PICK형)")).toBeInTheDocument();
    expect(screen.getByText("김하루")).toBeInTheDocument();
    expect(screen.getByText("@haru_beauty")).toBeInTheDocument();
  });

  it("모르는 코드는 서버 값을 그대로 보이고 계약 대상이 없으면 대시다", () => {
    render(
      <UsageDetail
        record={{
          ...deduction,
          campaignType: null,
          campaignTypeText: "live",
          usageDetail: null,
          usageDetailText: "매칭거절",
          contractTarget: null,
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("live")).toBeInTheDocument();
    expect(screen.getByText("매칭거절")).toBeInTheDocument();
    expect(screen.getByText("계약 대상").nextElementSibling).toHaveTextContent(
      "-",
    );
  });

  it.each([
    [refund, "환급 일자", "사용 금액", "30,000원"],
    [charge, "충전 일자", "충전 금액", "100,000원"],
    [withdrawal, "출금 일자", "출금 금액", "-100,000원"],
  ])(
    "유형별 일자·금액 라벨을 쓰고 금액은 음수만 부호를 붙인다(%#)",
    (record, dateLabel, amountLabel, amountText) => {
      render(<UsageDetail record={record} onClose={vi.fn()} />);

      const terms = screen.getAllByRole("term").map((term) => term.textContent);
      expect(terms[1]).toBe(dateLabel);
      expect(terms[7]).toBe(amountLabel);
      const amount = screen.getByText(amountText);
      expect(amount).toHaveClass("font-semibold");
      expect(amount).not.toHaveClass("text-primary");
    },
  );

  it("충전·출금은 캠페인 항목 값을 빈칸으로 둔다", () => {
    render(<UsageDetail record={charge} onClose={vi.fn()} />);

    for (const label of [
      "캠페인 명",
      "캠페인 유형",
      "캠페인 코드",
      "사용 내역",
      "계약 대상",
    ]) {
      expect(screen.getByText(label).nextElementSibling).toHaveTextContent(
        /^$/,
      );
    }
  });

  it("캠페인 명 옆에 썸네일 칸을 그리고 충전·출금 행에는 그리지 않는다", () => {
    const { container } = render(
      <UsageTable
        records={[
          { ...deduction, campaignImageUrl: "https://cdn.bigbird.local/c.png" },
          charge,
        ]}
        activeId={null}
        onClickDetail={vi.fn()}
      />,
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows[0]?.querySelector('[data-slot="avatar"]')).not.toBeNull();
    expect(rows[1]?.querySelector('[data-slot="avatar"]')).toBeNull();
  });
});
