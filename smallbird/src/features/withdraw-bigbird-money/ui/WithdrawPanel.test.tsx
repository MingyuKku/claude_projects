import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { ApiError } from "@/shared/api";

import { requestWithdraw } from "../api/withdraw-api";
import { WithdrawPanel } from "./WithdrawPanel";

import type * as Account from "@/entities/account";

const refreshBalance = vi.hoisted(() => vi.fn());
const bankListState = vi.hoisted(() => ({
  isError: false,
  mutate: vi.fn(),
}));
const balanceState = vi.hoisted(() => ({
  balance: { amount: 800000 } as { amount: number } | undefined,
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));
vi.mock("@/entities/account", async (importOriginal) => ({
  ...(await importOriginal<typeof Account>()),
  useBankList: () => ({
    banks: [
      { idx: 1, name: "신한은행" },
      { idx: 2, name: "국민은행" },
    ],
    isError: bankListState.isError,
    mutate: bankListState.mutate,
  }),
}));
vi.mock("@/entities/bigbird-money", () => ({
  useBigbirdMoneyBalance: () => ({
    balance: balanceState.balance,
    mutate: refreshBalance,
  }),
  BalanceCard: ({ amount }: { amount?: number }) => <p>보유 {amount}원</p>,
}));
vi.mock("../api/withdraw-api", () => ({ requestWithdraw: vi.fn() }));

// jsdom에는 Radix Select·ScrollArea가 쓰는 포인터 캡처·스크롤·크기 관찰 API가 없음.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

beforeEach(() => {
  balanceState.balance = { amount: 800000 };
  bankListState.isError = false;
  bankListState.mutate.mockReset();
  refreshBalance.mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(requestWithdraw)
    .mockReset()
    .mockResolvedValue({
      id: "W1",
      requestedAt: new Date("2026-10-30T10:30:00"),
      amount: 800000,
    });
});

function setup() {
  const onClose = vi.fn();
  const onWithdrawn = vi.fn();
  const { container } = render(
    <WithdrawPanel onClose={onClose} onWithdrawn={onWithdrawn} />,
  );
  const user = userEvent.setup({ applyAccept: false });
  const bankBook = new File(["x"], "통장.pdf", { type: "application/pdf" });
  const next = () => screen.getByRole("button", { name: "다음" });
  return {
    onClose,
    onWithdrawn,
    user,
    bankBook,
    next,
    pickFile: (file: File) =>
      user.upload(
        container.querySelector<HTMLInputElement>('input[type="file"]')!,
        file,
      ),
    async fillAll() {
      await user.click(screen.getByRole("combobox", { name: /출금 은행/ }));
      await user.click(await screen.findByRole("option", { name: "국민은행" }));
      await user.type(
        screen.getByRole("textbox", { name: /출금 계좌번호/ }),
        "110-123",
      );
      await user.type(
        screen.getByRole("textbox", { name: /출금 예금주 명/ }),
        " 홍길동 ",
      );
      await user.upload(
        container.querySelector<HTMLInputElement>('input[type="file"]')!,
        bankBook,
      );
    },
  };
}

describe("WithdrawPanel 1단계", () => {
  it("처음에는 다음이 비활성이다", () => {
    const { next } = setup();
    expect(next()).toBeDisabled();
    expect(screen.getByText("전액 출금만 가능합니다.")).toBeInTheDocument();
  });

  it("계좌번호는 숫자만 입력된다", async () => {
    const { user } = setup();
    const input = screen.getByRole("textbox", { name: /출금 계좌번호/ });
    await user.type(input, "11a0-12 3");
    expect(input).toHaveValue("110123");
  });

  it("계좌번호는 20자까지만 입력된다", async () => {
    const { user } = setup();
    const input = screen.getByRole("textbox", { name: /출금 계좌번호/ });
    await user.type(input, "1".repeat(25));
    expect(input).toHaveValue("1".repeat(20));
  });

  it("통장 사본까지 모두 채워야 다음이 활성이고, 공백만의 예금주 명은 빈 값이다", async () => {
    const { user, next, bankBook, pickFile } = setup();
    await user.click(screen.getByRole("combobox", { name: /출금 은행/ }));
    await user.click(await screen.findByRole("option", { name: "신한은행" }));
    await user.type(
      screen.getByRole("textbox", { name: /출금 계좌번호/ }),
      "1",
    );
    await user.type(
      screen.getByRole("textbox", { name: /출금 예금주 명/ }),
      "   ",
    );
    await pickFile(bankBook);
    expect(next()).toBeDisabled();
    await user.type(
      screen.getByRole("textbox", { name: /출금 예금주 명/ }),
      "홍",
    );
    expect(next()).toBeEnabled();
  });

  it("허용하지 않는 형식의 통장 사본은 받지 않고 오류 문구를 보인다", async () => {
    const { pickFile, next } = setup();
    await pickFile(new File(["x"], "통장.gif", { type: "image/gif" }));
    expect(
      screen.getByText("JPG, PNG, PDF 파일만 업로드할 수 있습니다."),
    ).toBeInTheDocument();
    expect(next()).toBeDisabled();
  });

  it("은행 목록을 불러오지 못하면 은행 Select를 막고 안내와 다시 시도를 보인다", async () => {
    bankListState.isError = true;
    const { user } = setup();
    expect(screen.getByRole("combobox", { name: /출금 은행/ })).toBeDisabled();
    expect(
      screen.getByText("은행 목록을 불러오지 못했습니다."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(bankListState.mutate).toHaveBeenCalled();
  });

  it("잔액을 모르면 다음이 비활성이다", async () => {
    balanceState.balance = undefined;
    const { fillAll, next } = setup();
    await fillAll();
    expect(next()).toBeDisabled();
  });
});

describe("WithdrawPanel 2단계·요청", () => {
  it("다음을 누르면 입력값을 확인하고 뒤로가기로 입력값을 유지한 채 1단계로 돌아간다", async () => {
    const { user, fillAll, next } = setup();
    await fillAll();
    await user.click(next());

    expect(screen.getByText("800,000원")).toBeInTheDocument();
    expect(screen.getByText("국민은행")).toBeInTheDocument();
    expect(screen.getByText("110123")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("입력된 계좌로 출금")).toBeInTheDocument();
    expect(screen.getByText("0원")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "뒤로가기" }));
    expect(screen.getByRole("textbox", { name: /출금 계좌번호/ })).toHaveValue(
      "110123",
    );
    expect(screen.getByDisplayValue("통장.pdf")).toBeInTheDocument();
  });

  it("요청하면 request JSON(금액은 보유 잔액)과 통장 사본 파일을 보내고 성공을 알린다", async () => {
    const { user, fillAll, next, onWithdrawn, bankBook } = setup();
    await fillAll();
    await user.click(next());
    await user.click(
      screen.getByRole("button", { name: "전액 출금 요청하기" }),
    );

    await waitFor(() => expect(onWithdrawn).toHaveBeenCalled());
    expect(requestWithdraw).toHaveBeenCalledWith(
      {
        bankIdx: 2,
        accountNumber: "110123",
        accountHolder: "홍길동",
        amount: 800000,
      },
      bankBook,
    );
    expect(onWithdrawn.mock.calls[0]?.[0]).toMatchObject({ id: "W1" });
  });

  it("요청 중에는 버튼이 비활성이라 다시 보내지 않는다", async () => {
    vi.mocked(requestWithdraw).mockReturnValue(new Promise(() => undefined));
    const { user, fillAll, next } = setup();
    await fillAll();
    await user.click(next());
    const submit = screen.getByRole("button", { name: "전액 출금 요청하기" });
    await user.click(submit);
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(requestWithdraw).toHaveBeenCalledTimes(1);
  });

  async function submitWithError(error: ApiError) {
    vi.mocked(requestWithdraw).mockRejectedValue(error);
    const utils = setup();
    await utils.fillAll();
    await utils.user.click(utils.next());
    await utils.user.click(
      screen.getByRole("button", { name: "전액 출금 요청하기" }),
    );
    return utils;
  }

  const failure = (status: number, reason: string) =>
    new ApiError(status, { result: false, reason });

  it("400 입력 오류는 1단계로 돌아가 해당 입력 아래에 문구를 보인다", async () => {
    await submitWithError(failure(400, "INVALID_ACCOUNT_NUMBER"));
    expect(
      await screen.findByText("계좌번호를 숫자만 정확히 입력해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
  });

  it("통장 사본 파일 오류는 파일을 비우고 형식 문구를 보인다", async () => {
    await submitWithError(failure(400, "INVALID_BANK_BOOK_FILE"));
    expect(
      await screen.findByText("JPG, PNG, PDF 파일만 업로드할 수 있습니다."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  });

  it("ZERO_BALANCE는 토스트·잔액 갱신 후 패널을 닫는다", async () => {
    const { onClose } = await submitWithError(failure(409, "ZERO_BALANCE"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("출금할 빅버드 머니가 없습니다.");
    expect(refreshBalance).toHaveBeenCalled();
  });

  it("PENDING_WITHDRAWAL_EXISTS는 토스트 후 패널을 닫는다", async () => {
    const { onClose } = await submitWithError(
      failure(409, "PENDING_WITHDRAWAL_EXISTS"),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(
      "처리 중인 출금 요청이 있습니다. 처리가 끝난 뒤 다시 요청해 주세요.",
    );
  });

  it("BALANCE_CHANGED는 잔액을 갱신하고 2단계에 머문다", async () => {
    const { onClose } = await submitWithError(failure(409, "BALANCE_CHANGED"));
    await waitFor(() => expect(refreshBalance).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(
      "보유 빅버드 머니가 바뀌었습니다. 출금 금액을 다시 확인해 주세요.",
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "전액 출금 요청하기" }),
    ).toBeEnabled();
  });

  it("403 등 그 밖의 오류는 일반 실패 토스트이고 2단계에 머문다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await submitWithError(new ApiError(403, undefined));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "출금 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      ),
    );
    expect(
      screen.getByRole("button", { name: "전액 출금 요청하기" }),
    ).toBeEnabled();
  });
});
