import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useInquiryAttachments } from "../model/useInquiryAttachments";
import { AttachmentTextField } from "./AttachmentTextField";

function Harness() {
  const attachments = useInquiryAttachments();
  return (
    <AttachmentTextField
      attachments={attachments}
      maxLength={3000}
      aria-label="문의 남기기"
    />
  );
}

describe("AttachmentTextField", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });
  const fileInput = () =>
    document.querySelector<HTMLInputElement>("input[type=file]")!;

  it("파일을 고르면 입력창 위에 썸네일이 생긴다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.upload(
      fileInput(),
      new File(["x"], "a.png", { type: "image/png" }),
    );
    expect(screen.getByRole("img", { name: "a.png" })).toBeInTheDocument();
  });

  it("담은 파일은 썸네일의 삭제 버튼으로 뺀다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.upload(fileInput(), new File(["x"], "a.png"));
    await user.click(screen.getByRole("button", { name: "첨부 삭제" }));
    expect(
      screen.queryByRole("img", { name: "a.png" }),
    ).not.toBeInTheDocument();
  });

  it("문서는 이름·용량이 있는 카드로 보이고 빼기 버튼으로 뺀다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.upload(
      fileInput(),
      new File([new Uint8Array(2560)], "견적서.docx"),
    );
    expect(screen.getByText("견적서.docx")).toBeInTheDocument();
    expect(screen.getByText("2.5KB")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "첨부 삭제" }));
    expect(screen.queryByText("견적서.docx")).not.toBeInTheDocument();
  });

  it("30MB가 넘는 문서는 담지 않고 문서 용량 안내를 띄운다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const big = new File(["x"], "big.pdf");
    Object.defineProperty(big, "size", { value: 30 * 1024 * 1024 + 1 });
    await user.upload(fileInput(), big);
    expect(await screen.findByText("첨부파일 용량 초과")).toBeInTheDocument();
    expect(screen.queryByText("big.pdf")).not.toBeInTheDocument();
  });

  it("허용하지 않는 형식은 담지 않고 취소·확인이 있는 안내를 띄운다", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<Harness />);
    await user.upload(fileInput(), new File(["x"], "a.gif"));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("첨부파일 형식 불일치");
    expect(
      screen.queryByRole("img", { name: "a.gif" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    await user.upload(fileInput(), new File(["x"], "a.gif"));
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("이미 10개가 담겨 있으면 첨부를 눌렀을 때 파일 선택창 대신 개수 초과 안내를 바로 띄운다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
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
