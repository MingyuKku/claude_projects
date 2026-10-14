import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AlertPopup, AuthButton, PasswordInput } from "./index";

describe("AuthButton", () => {
  it("기본 type 은 button 이라 폼을 제출하지 않는다", () => {
    render(<AuthButton color="primary">확인</AuthButton>);
    expect(screen.getByRole("button", { name: "확인" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("disabled 이면 클릭해도 핸들러가 호출되지 않는다", async () => {
    const onClick = vi.fn();
    render(
      <AuthButton color="light" disabled onClick={onClick}>
        확인
      </AuthButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "확인" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("className 을 열어 두며 같은 그룹의 클래스는 덮어쓴다", () => {
    render(
      <AuthButton color="primary" className="bg-negative">
        확인
      </AuthButton>,
    );
    const button = screen.getByRole("button", { name: "확인" });
    expect(button).toHaveClass("bg-negative");
    expect(button).not.toHaveClass("bg-brand");
  });
});

describe("PasswordInput", () => {
  it("처음에는 숨김 상태이고 토글하면 보기/숨기기가 바뀐다", async () => {
    render(<PasswordInput label="비밀번호" />);
    const input = screen.getByLabelText("비밀번호");
    expect(input).toHaveAttribute("type", "password");

    await userEvent.click(
      screen.getByRole("button", { name: "비밀번호 보기" }),
    );
    expect(input).toHaveAttribute("type", "text");

    await userEvent.click(
      screen.getByRole("button", { name: "비밀번호 숨기기" }),
    );
    expect(input).toHaveAttribute("type", "password");
  });

  it("입력값을 그대로 전달한다", async () => {
    render(<PasswordInput label="비밀번호" />);
    await userEvent.type(screen.getByLabelText("비밀번호"), "abc123");
    expect(screen.getByLabelText("비밀번호")).toHaveValue("abc123");
  });
});

describe("AlertPopup", () => {
  it("alertdialog 역할과 제목 연결을 가진다", () => {
    render(
      <AlertPopup
        title="안내"
        message="내용"
        confirmLabel="확인"
        onClickConfirm={vi.fn()}
      />,
    );
    expect(screen.getByRole("alertdialog", { name: "안내" })).toBeVisible();
  });

  it("확인 버튼은 onClickConfirm 을 호출한다", async () => {
    const onClickConfirm = vi.fn();
    render(
      <AlertPopup
        title="안내"
        message="내용"
        confirmLabel="확인"
        onClickConfirm={onClickConfirm}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "확인" }));
    expect(onClickConfirm).toHaveBeenCalledOnce();
  });

  it("취소 버튼과 닫기 버튼은 onClickCancel 을 호출한다", async () => {
    const onClickCancel = vi.fn();
    const onClickConfirm = vi.fn();
    render(
      <AlertPopup
        title="안내"
        message="내용"
        cancelLabel="취소"
        confirmLabel="확인"
        onClickCancel={onClickCancel}
        onClickConfirm={onClickConfirm}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClickCancel).toHaveBeenCalledTimes(2);
    expect(onClickConfirm).not.toHaveBeenCalled();
  });

  it("onClickCancel 이 없으면 닫기 버튼이 onClickConfirm 으로 폴백한다", async () => {
    const onClickConfirm = vi.fn();
    render(
      <AlertPopup
        title="안내"
        message="내용"
        confirmLabel="확인"
        onClickConfirm={onClickConfirm}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClickConfirm).toHaveBeenCalledOnce();
  });

  it("hideCloseButton 이면 닫기 버튼이 없다", () => {
    render(
      <AlertPopup
        title="안내"
        message="내용"
        confirmLabel="확인"
        onClickConfirm={vi.fn()}
        hideCloseButton
      />,
    );
    expect(screen.queryByRole("button", { name: "닫기" })).toBeNull();
  });
});
