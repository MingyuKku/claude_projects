import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { serverApiV3 } from "@/shared/api";

import { BankAccountForm } from "./BankAccountForm";

import type * as SharedApi from "@/shared/api";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const banks = [
  { idx: 1, name: "신한은행" },
  { idx: 2, name: "국민은행" },
];
const account = {
  bankName: "국민은행",
  accountNumber: "110-123-456789",
  accountHolder: "홍길동",
  hasBankBookFile: true,
};

function setup(props: { account?: typeof account | null } = {}) {
  const onSaved = vi.fn();
  const { container } = render(
    <BankAccountForm
      account={props.account === undefined ? account : props.account}
      banks={banks}
      onSaved={onSaved}
    />,
  );
  return { container, onSaved, user: userEvent.setup({ applyAccept: false }) };
}

// jsdom에는 Radix Select가 쓰는 포인터 캡처·스크롤 API가 없음.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

beforeEach(() => {
  vi.mocked(toast).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(serverApiV3.post).mockReset().mockResolvedValue({ result: true });
});

describe("BankAccountForm", () => {
  it("등록된 계좌의 은행 이름을 목록에서 찾아 선택값으로 보인다", () => {
    setup();
    expect(screen.getByRole("combobox", { name: /은행/ })).toHaveTextContent(
      "국민은행",
    );
    expect(screen.getByDisplayValue("등록됨")).toBeInTheDocument();
  });

  it("4개 항목이 모두 차 있으면 저장할 수 있고, 하나라도 비우면 저장할 수 없다", async () => {
    const { user } = setup();
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();
    await user.clear(screen.getByRole("textbox", { name: /예금주/ }));
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("미등록 계좌는 은행을 고르고 통장사본을 올리기 전까지 저장할 수 없다", async () => {
    const { user, container } = setup({ account: null });
    await user.type(screen.getByRole("textbox", { name: /계좌번호/ }), "123");
    await user.type(screen.getByRole("textbox", { name: /예금주/ }), "홍길동");
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    await user.click(screen.getByRole("combobox", { name: /은행/ }));
    await user.click(await screen.findByRole("option", { name: "신한은행" }));
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    await user.upload(
      container.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(["x"], "bank.pdf", { type: "application/pdf" }),
    );
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();
  });

  it("저장하면 계좌번호의 하이픈을 지워 보내고 성공을 알린다", async () => {
    const { user, onSaved } = setup();
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(serverApiV3.post).toHaveBeenCalledWith("/mypage/account/bank", {
        bankIdx: 2,
        accountHolder: "홍길동",
        accountNumber: "110123456789",
      }),
    );
    await waitFor(() => expect(toast).toHaveBeenCalledWith("저장되었습니다."));
    expect(onSaved).toHaveBeenCalled();
  });

  it("통장사본을 올려 저장하면 등록됨이 아니라 파일명으로 보인다", async () => {
    const { user, container } = setup();
    await user.upload(
      container.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(["x"], "bank-copy.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("저장되었습니다."));
    expect(screen.getByRole("textbox", { name: /통장사본/ })).toHaveValue(
      "bank-copy.pdf",
    );
  });

  it("정산 기간 거부(result true, reason denied)는 성공이 아니라 안내 토스트로 처리한다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      reason: "denied",
    });
    const { user, onSaved } = setup();
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "매달 5일~10일 정산 기간에는 계좌 정보를 수정할 수 없습니다.",
      ),
    );
    expect(toast).not.toHaveBeenCalledWith("저장되었습니다.");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("허용하지 않는 형식의 통장사본은 오류 문구를 보인다", async () => {
    const { user, container } = setup();
    await user.upload(
      container.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(["x"], "a.gif", { type: "image/gif" }),
    );
    expect(
      screen.getByText("JPG, PNG, PDF 파일만 업로드할 수 있습니다."),
    ).toBeInTheDocument();
  });
});
