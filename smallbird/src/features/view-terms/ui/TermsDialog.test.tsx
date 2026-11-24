import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useTermsDialog } from "../model/use-terms-dialog";
import { TermsDialog } from "./TermsDialog";

function Harness() {
  const terms = useTermsDialog();
  return (
    <>
      <button type="button" onClick={() => terms.openTerms("privacy")}>
        열기-개인정보
      </button>
      <button type="button" onClick={() => terms.openTerms("service")}>
        열기-이용약관
      </button>
      <TermsDialog
        kind={terms.kind}
        isOpen={terms.isOpen}
        onClose={terms.closeTerms}
      />
    </>
  );
}

describe("TermsDialog", () => {
  it("종류에 맞는 제목과 전문을 보여 준다", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "열기-이용약관" }));

    const dialog = await screen.findByRole("dialog", { name: "이용약관" });
    expect(dialog).toHaveTextContent("제 1 장 총칙");

    await user.click(screen.getByRole("button", { name: "취소" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "열기-개인정보" }));
    expect(
      await screen.findByRole("dialog", { name: "개인정보처리방침" }),
    ).toBeInTheDocument();
  });

  it("취소·확인·닫기가 모두 닫기만 한다", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    for (const name of ["취소", "확인", "닫기"]) {
      await user.click(screen.getByRole("button", { name: "열기-개인정보" }));
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("button", { name }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
    }
  });
});
