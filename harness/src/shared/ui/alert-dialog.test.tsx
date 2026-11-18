import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";

describe("AlertDialog", () => {
  it("확인·취소 버튼을 렌더링하고 취소와 확인 후 닫힌다", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>대화상자 열기</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>작업 확인</AlertDialogTitle>
          <AlertDialogDescription>작업을 진행할까요?</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    const trigger = screen.getByRole("button", { name: "대화상자 열기" });
    await user.click(trigger);
    expect(screen.getByRole("alertdialog", { name: "작업 확인" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "취소" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(handleConfirm).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(handleConfirm).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
