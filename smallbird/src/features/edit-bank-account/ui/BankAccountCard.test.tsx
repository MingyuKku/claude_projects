import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { ApiError, serverApiV3 } from "@/shared/api";

import { BankAccountCard } from "./BankAccountCard";

import type { BankAccountViewModel } from "../model/schema";
import type * as SharedApi from "@/shared/api";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    download: vi.fn(),
  },
}));

const banks = [
  { idx: 1, name: "국민은행" },
  { idx: 2, name: "신한은행" },
];

const account: BankAccountViewModel = {
  bankName: "신한은행",
  accountNumber: "110123456789",
  accountHolder: "(주)빅버드컴퍼니",
  hasBankBookFile: true,
  bankBookFileName: "통장사본.pdf",
};

function setup(props: { account?: BankAccountViewModel | null } = {}) {
  const onSaved = vi.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <BankAccountCard
        account={props.account === undefined ? account : props.account}
        banks={banks}
        onSaved={onSaved}
      />
    </SWRConfig>,
  );
  return { onSaved, user: userEvent.setup() };
}

async function confirmPassword(
  user: ReturnType<typeof userEvent.setup>,
  buttonName: string,
) {
  await user.click(screen.getByRole("button", { name: buttonName }));
  const dialog = await screen.findByRole("dialog", {
    name: "관리자 비밀번호 입력",
  });
  await user.type(
    within(dialog).getByPlaceholderText("비밀번호를 입력해주세요"),
    "right",
  );
  await user.click(within(dialog).getByRole("button", { name: "확인" }));
}

beforeEach(() => {
  vi.mocked(serverApiV3.get).mockReset();
  vi.mocked(serverApiV3.post).mockReset().mockResolvedValue({ result: true });
  vi.mocked(serverApiV3.put).mockReset();
  vi.mocked(serverApiV3.download).mockReset();
});

describe("BankAccountCard", () => {
  it("등록된 계좌는 읽기 전용 값과 통장사본 다운로드 버튼을 보인다", () => {
    setup();
    expect(screen.getByText("신한은행")).toBeInTheDocument();
    expect(screen.getByText("110123456789")).toBeInTheDocument();
    expect(screen.getByText("(주)빅버드컴퍼니")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "통장사본.pdf 다운로드" }),
    ).toBeEnabled();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  describe("통장사본 다운로드", () => {
    let savedName: string | undefined;

    beforeEach(() => {
      savedName = undefined;
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:bank");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        function (this: HTMLAnchorElement) {
          savedName = this.download;
        },
      );
    });

    afterEach(() => vi.restoreAllMocks());

    it("서버가 준 파일 이름으로 저장한다", async () => {
      vi.mocked(serverApiV3.download).mockResolvedValue({
        blob: new Blob(["pdf"]),
        fileName: "서버이름.pdf",
      });
      const { user } = setup();
      await user.click(
        screen.getByRole("button", { name: "통장사본.pdf 다운로드" }),
      );
      await waitFor(() => expect(savedName).toBe("서버이름.pdf"));
      expect(serverApiV3.download).toHaveBeenCalledWith(
        "/mypage/account/bank/download",
      );
    });

    it("서버가 이름을 주지 않으면 조회로 받은 원본 이름을 쓴다", async () => {
      vi.mocked(serverApiV3.download).mockResolvedValue({
        blob: new Blob(["pdf"]),
        fileName: null,
      });
      const { user } = setup();
      await user.click(
        screen.getByRole("button", { name: "통장사본.pdf 다운로드" }),
      );
      await waitFor(() => expect(savedName).toBe("통장사본.pdf"));
    });

    it("실패하면 오류로 안내하고 저장하지 않는다", async () => {
      vi.mocked(serverApiV3.download).mockRejectedValue(
        new ApiError(404, undefined),
      );
      const { user } = setup();
      await user.click(
        screen.getByRole("button", { name: "통장사본.pdf 다운로드" }),
      );
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "파일을 내려받지 못했습니다. 다시 시도해 주세요.",
        ),
      );
      expect(savedName).toBeUndefined();
    });
  });

  it("미등록이면 값은 -이고 통장사본은 '등록된 파일이 없습니다'이며 버튼은 등록이다", () => {
    setup({ account: null });
    expect(screen.getAllByText("-")).toHaveLength(3);
    expect(screen.getByText("등록된 파일이 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "등록" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "수정" })).toBeNull();
  });

  it("수정은 비밀번호 확인 뒤 입력 모드가 되고, 취소하면 보기로 돌아가 다음에 다시 묻는다", async () => {
    const { user } = setup();
    await confirmPassword(user, "수정");
    expect(
      await screen.findByRole("textbox", { name: /계좌번호/ }),
    ).toHaveValue("110123456789");

    await user.click(screen.getByRole("button", { name: "취소" }));
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());

    await user.click(screen.getByRole("button", { name: "수정" }));
    expect(
      await screen.findByRole("dialog", { name: "관리자 비밀번호 입력" }),
    ).toBeInTheDocument();
  });

  it("비밀번호가 다르면 입력 모드로 가지 않는다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({ result: false });
    const { user } = setup();
    await confirmPassword(user, "수정");
    expect(
      await screen.findByText("비밀번호가 일치하지 않습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /계좌번호/ })).toBeNull();
  });

  it("미등록 상태에서 등록 입력을 취소하면 미등록 보기로 돌아간다", async () => {
    const { user } = setup({ account: null });
    await confirmPassword(user, "등록");
    expect(
      await screen.findByRole("textbox", { name: /계좌번호/ }),
    ).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(await screen.findByRole("button", { name: "등록" })).toBeVisible();
  });
});
