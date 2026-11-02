import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { BankAccountSection } from "./BankAccountSection";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const BANK_LIST_PATH = "/mypage/account/bank/list";

function setup() {
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <BankAccountSection />
    </SWRConfig>,
  );
  return { user: userEvent.setup() };
}

function countBankListCalls() {
  return vi
    .mocked(serverApiV3.get)
    .mock.calls.filter(([path]) => path === BANK_LIST_PATH).length;
}

beforeEach(() => {
  vi.mocked(serverApiV3.get).mockReset();
});

describe("BankAccountSection", () => {
  it("은행 목록만 실패해도 다시 시도하면 목록을 다시 읽어 폼을 연다", async () => {
    let isBankListDown = true;
    vi.mocked(serverApiV3.get).mockImplementation((path: string) => {
      if (path !== BANK_LIST_PATH) return Promise.resolve({ result: false });
      if (isBankListDown) return Promise.reject(new Error("bank list"));
      return Promise.resolve({ bankList: [{ idx: 1, name: "국민은행" }] });
    });
    const { user } = setup();

    const retryButton = await screen.findByRole("button", {
      name: "다시 시도",
    });
    isBankListDown = false;
    await user.click(retryButton);

    // 등록된 계좌가 없으면 값이 `-`인 보기에 "등록" 버튼이 열림.
    expect(
      await screen.findByRole("button", { name: "등록" }),
    ).toBeInTheDocument();
    expect(countBankListCalls()).toBe(2);
  });
});
