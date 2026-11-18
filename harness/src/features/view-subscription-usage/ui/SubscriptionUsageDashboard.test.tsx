import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SubscriptionUsageDashboard } from "./SubscriptionUsageDashboard";

// 목 데이터(개발 서버·테스트 환경)는 `?mock=`으로 구독 중인 상품을 바꿈.
function setMock(mock: string) {
  window.history.replaceState(null, "", `/?mock=${mock}`);
}

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("SubscriptionUsageDashboard", () => {
  it("구독 중이면 사용·잔여 횟수와 브랜드형·공구형 카드를 보인다", () => {
    setMock("recruit");
    render(
      <SubscriptionUsageDashboard type="recruit" onChangeType={vi.fn()} />,
    );

    expect(screen.getByText("인플루언서 검색 횟수")).toBeInTheDocument();
    expect(screen.getAllByText("320 건").length).toBeGreaterThan(0);
    expect(screen.getByText("180 건")).toBeInTheDocument();
    expect(screen.getByText("모집형 브랜드형")).toBeInTheDocument();
    expect(screen.getByText("모집형 공구형")).toBeInTheDocument();
    // 매칭 성사 수는 PICK형만.
    expect(screen.queryByText("매칭 성사 수")).not.toBeInTheDocument();
  });

  it("PICK형은 지표 목록과 하단 카드에 매칭 성사 수가 더해진다", () => {
    setMock("pick");
    render(<SubscriptionUsageDashboard type="pick" onChangeType={vi.fn()} />);

    expect(screen.getByText("PICK형 브랜드형")).toBeInTheDocument();
    expect(screen.getAllByText("매칭 성사 수")).toHaveLength(2);
  });

  it("구독하지 않은 상품은 값 없이 빈 상태를 보이고 하단 카드가 없다", () => {
    setMock("none");
    render(
      <SubscriptionUsageDashboard type="recruit" onChangeType={vi.fn()} />,
    );

    expect(screen.getByText("이용 현황이 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("상품을 구독해주세요.")).toBeInTheDocument();
    expect(screen.getAllByText("- 건")).toHaveLength(4);
    expect(screen.queryByText("모집형 브랜드형")).not.toBeInTheDocument();
  });

  it("세그먼트로 상품을 바꾸면 알린다", async () => {
    setMock("both");
    const onChangeType = vi.fn();
    render(
      <SubscriptionUsageDashboard type="recruit" onChangeType={onChangeType} />,
    );

    await userEvent.click(screen.getByRole("radio", { name: "PICK형" }));

    expect(onChangeType).toHaveBeenCalledWith("pick");
  });

  it("일별로 바꾸면 월 선택과 일별 이용량 제목이 나온다", async () => {
    setMock("recruit");
    render(
      <SubscriptionUsageDashboard type="recruit" onChangeType={vi.fn()} />,
    );
    expect(screen.getByText("월별 이용량")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "일별" }));

    expect(screen.getByText("일별 이용량")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(3);
  });
});
