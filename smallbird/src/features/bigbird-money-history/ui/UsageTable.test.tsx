import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UsageCardList } from "./UsageCardList";
import { UsageTable } from "./UsageTable";

import type { UsageRecord } from "../model/usage-types";

const deduction: UsageRecord = {
  id: "0",
  usedAt: new Date("2026-10-23T14:23:18"),
  usedAtText: "2026-10-23 14:23:18",
  campaignName: "2026 여름 시즌 캠핑 용품 신제품 리뷰 캠페인",
  campaignCode: "CP0001",
  campaignType: "PICK형",
  usageLabel: "인플루언서 계약비용(PICK형)",
  amount: -50000,
  remainingAmount: 1250000,
};
const refund: UsageRecord = {
  ...deduction,
  id: "1",
  campaignCode: "-",
  amount: 30000,
  remainingAmount: null,
};

describe("UsageTable", () => {
  it("열이 캠페인 명·사용 일자·사용 내역·사용 금액·캠페인 코드·상세 보기 순서다", () => {
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
      "캠페인 명",
      "사용 일자",
      "사용 내역",
      "사용 금액",
      "캠페인 코드",
      "상세 보기",
    ]);
    // 사용 후 잔액은 표에 없고 상세 보기에만 있다.
    expect(screen.queryByText("1,250,000원")).not.toBeInTheDocument();
  });

  it("차감은 빨간 -금액, 반환은 초록 +금액으로 보인다", () => {
    render(
      <UsageTable
        records={[deduction, refund]}
        activeId={null}
        onClickDetail={vi.fn()}
      />,
    );

    expect(screen.getByText("-50,000원")).toHaveClass("text-destructive");
    expect(screen.getByText("+30,000원")).toHaveClass("text-success");
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
  it("값이 없는 항목도 행을 숨기지 않고 -로 둔다", () => {
    render(<UsageCardList records={[refund]} />);

    expect(screen.getAllByRole("term")).toHaveLength(7);
    expect(
      screen.getByText("캠페인 코드").nextElementSibling,
    ).toHaveTextContent("-");
    expect(
      screen.getByText("사용 후 잔액").nextElementSibling,
    ).toHaveTextContent("-");
  });
});
