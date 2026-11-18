import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewBigbirdInquiryForm } from "./NewBigbirdInquiryForm";

// Radix RadioGroup 이 쓰는 브라우저 API 가 jsdom 에 없어 이 파일에서만 채움.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("새 문의 UI", () => {
  it("유형을 전환하면 캠페인 표를 숨기고, 방식 선택과 본문 입력은 없다", async () => {
    const user = userEvent.setup();
    render(<NewBigbirdInquiryForm campaigns={[]} />);
    expect(
      screen.getByRole("table", { name: "캠페인 선택" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("캠페인 내역이 존재하지 않습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: /^실시간 상담하기/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "문의하기" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: /^기타 문의/ }));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("캠페인을 하나만 선택하고 선택한 캠페인을 제출 데이터로 전달한다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <NewBigbirdInquiryForm
        campaigns={[
          { id: 1, name: "첫 캠페인", periodLabel: "2027.05.12 ~ 2027.05.31" },
          { id: 2, name: "두 번째 캠페인" },
        ]}
        onSubmit={onSubmit}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "첫 캠페인" }));
    await user.click(screen.getByRole("checkbox", { name: "두 번째 캠페인" }));
    expect(
      screen.getByRole("checkbox", { name: "첫 캠페인" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "두 번째 캠페인" }),
    ).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "두 번째 캠페인" }));
    expect(
      screen.getByRole("checkbox", { name: "두 번째 캠페인" }),
    ).not.toBeChecked();
    expect(screen.getByRole("button", { name: "문의하기" })).toBeDisabled();
    await user.click(screen.getByText("두 번째 캠페인", { selector: "label" }));
    await user.click(screen.getByRole("button", { name: "문의하기" }));
    expect(onSubmit).toHaveBeenCalledWith({ campaignId: 2 });
  });

  it("캠페인 목록 조회에 실패하면 '캠페인 없음' 대신 오류와 다시 시도를 보여 준다", async () => {
    const user = userEvent.setup();
    const onClickRetryCampaigns = vi.fn();
    render(
      <NewBigbirdInquiryForm
        campaigns={[]}
        campaignsState="error"
        onClickRetryCampaigns={onClickRetryCampaigns}
      />,
    );

    expect(screen.getByText("문제가 발생했습니다")).toBeInTheDocument();
    expect(
      screen.queryByText("캠페인 내역이 존재하지 않습니다."),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onClickRetryCampaigns).toHaveBeenCalledOnce();
  });
});
