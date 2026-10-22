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
  it("유형과 방식을 전환해도 작성 내용을 보존하고 연동 전에는 전송하지 않는다", async () => {
    const user = userEvent.setup();
    render(<NewBigbirdInquiryForm campaigns={[]} />);
    expect(
      screen.getByRole("table", { name: "캠페인 선택" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "기간" }),
    ).toBeInTheDocument();
    // 캠페인이 없으면 안내 문구를 보여 주고 유형 카드 외 입력을 막음.
    expect(screen.getByText("신청하신 캠페인이 없습니다.")).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /^실시간 상담하기/ }),
    ).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "문의 남기기" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: /^기타 문의/ }));
    expect(
      screen.getByRole("radio", { name: /^실시간 상담하기/ }),
    ).toBeEnabled();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "문의 남기기" }),
      "작성 중인 질문",
    );
    await user.click(screen.getByRole("radio", { name: /^실시간 상담하기/ }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /^실시간 상담하기/ }),
    ).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("radio", { name: /^문의 남기기/ }));
    expect(screen.getByRole("textbox")).toHaveValue("작성 중인 질문");
    expect(screen.getByRole("button", { name: "첨부" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "전송" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "문의하기" })).toBeDisabled();
  });

  it("캠페인을 하나만 선택하고 선택한 문의 방식을 제출 데이터로 전달한다", async () => {
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
    await user.click(screen.getByRole("radio", { name: /^실시간 상담하기/ }));
    await user.click(screen.getByRole("button", { name: "문의하기" }));
    expect(onSubmit).toHaveBeenCalledWith({
      campaignId: 2,
      method: "realtime",
      body: "",
      files: [],
    });
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
      screen.queryByText("신청하신 캠페인이 없습니다."),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onClickRetryCampaigns).toHaveBeenCalledOnce();
  });
});

describe("첨부", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });
  const campaigns = [{ id: 1, name: "첫 캠페인" }];
  const fileInput = () =>
    document.querySelector<HTMLInputElement>("input[type=file]")!;

  it("파일을 고르면 입력창 위에 썸네일이 생기고 본문 없이도 제출할 수 있다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NewBigbirdInquiryForm campaigns={campaigns} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("checkbox", { name: "첫 캠페인" }));
    expect(screen.getByRole("button", { name: "문의하기" })).toBeDisabled();
    const file = new File(["x"], "a.png", { type: "image/png" });
    await user.upload(fileInput(), file);
    expect(screen.getByRole("img", { name: "a.png" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "문의하기" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "문의하기" }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ body: "", files: [file] }),
    );
  });

  it("담은 파일은 썸네일의 삭제 버튼으로 뺀다", async () => {
    const user = userEvent.setup();
    render(<NewBigbirdInquiryForm campaigns={campaigns} />);
    await user.upload(fileInput(), new File(["x"], "a.png"));
    await user.click(screen.getByRole("button", { name: "첨부 삭제" }));
    expect(
      screen.queryByRole("img", { name: "a.png" }),
    ).not.toBeInTheDocument();
  });

  it("허용하지 않는 형식은 담지 않고 확인 하나만 있는 안내를 띄운다", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<NewBigbirdInquiryForm campaigns={campaigns} />);
    await user.upload(fileInput(), new File(["x"], "a.gif"));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("첨부파일 형식 불일치");
    expect(
      screen.queryByRole("img", { name: "a.gif" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "취소" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("이미 10개가 담겨 있으면 첨부를 눌렀을 때 파일 선택창 대신 개수 초과 안내를 바로 띄운다", async () => {
    const user = userEvent.setup();
    render(<NewBigbirdInquiryForm campaigns={campaigns} />);
    const files = Array.from(
      { length: 10 },
      (_, i) => new File(["x"], `${i}.png`),
    );
    await user.upload(fileInput(), files);
    const click = vi.spyOn(fileInput(), "click");
    await user.click(screen.getByRole("button", { name: "첨부" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent(
      "이미지 최대 업로드 개수 초과",
    );
    expect(click).not.toHaveBeenCalled();
  });
});
