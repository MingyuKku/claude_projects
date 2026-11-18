import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { CompanyInfoCard } from "./CompanyInfoCard";

import type { CompanyInfoViewModel } from "@/entities/account";
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

const company: CompanyInfoViewModel = {
  companyName: "주식회사 빅버드",
  contact: "01012345678",
  businessNumber: "123-45-67890",
  mailorderNumber: "2024-서울강남-1234",
  categoryIdx: 3,
  categoryName: "패션/의류",
  companyUrl: "https://bigbird.co.kr",
  hasBusinessRegistrationFile: true,
  businessRegistrationFileName: "사업자등록증.pdf",
  hasMailorderFile: true,
  mailorderFileName: "신고증.png",
  hasBankBookFile: false,
};

function setup(props: { company?: CompanyInfoViewModel | null } = {}) {
  const onSaved = vi.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <CompanyInfoCard
        company={props.company === undefined ? company : props.company}
        onSaved={onSaved}
      />
    </SWRConfig>,
  );
  return { onSaved, user: userEvent.setup() };
}

beforeEach(() => {
  vi.mocked(serverApiV3.get)
    .mockReset()
    .mockResolvedValue({ category: [{ idx: 3, name: "패션/의류" }] });
  vi.mocked(serverApiV3.post).mockReset();
  vi.mocked(serverApiV3.put).mockReset().mockResolvedValue({ result: true });
});

describe("CompanyInfoCard", () => {
  it("등록된 회사정보는 읽기 전용 보기로 열리고 서류 버튼은 눌러서 내려받는다", () => {
    setup();
    expect(screen.getByText("주식회사 빅버드")).toBeInTheDocument();
    expect(screen.getByText("패션/의류")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(
      screen.getByRole("button", { name: "사업자등록증.pdf 다운로드" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "신고증.png 다운로드" }),
    ).toBeEnabled();
  });

  it("서류 버튼을 누르면 각 다운로드 API로 받아 서버가 준 이름으로 저장한다", async () => {
    let savedName = "";
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      savedName = this.download;
    });
    vi.mocked(serverApiV3.download).mockResolvedValue({
      blob: new Blob(["pdf"]),
      fileName: "서버이름.pdf",
    });
    const { user } = setup();
    await user.click(
      screen.getByRole("button", { name: "사업자등록증.pdf 다운로드" }),
    );
    await waitFor(() => expect(savedName).toBe("서버이름.pdf"));
    expect(serverApiV3.download).toHaveBeenLastCalledWith(
      "/mypage/account/company/registration/download",
    );
    await user.click(
      screen.getByRole("button", { name: "신고증.png 다운로드" }),
    );
    await waitFor(() =>
      expect(serverApiV3.download).toHaveBeenLastCalledWith(
        "/mypage/account/company/mailorder/download",
      ),
    );
    vi.restoreAllMocks();
  });

  it("비밀번호가 다르면 입력 모드로 가지 않는다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({ result: false });
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "수정" }));
    const dialog = await screen.findByRole("dialog", {
      name: "관리자 비밀번호 입력",
    });
    await user.type(
      within(dialog).getByPlaceholderText("비밀번호를 입력해주세요"),
      "wrong",
    );
    await user.click(within(dialog).getByRole("button", { name: "확인" }));
    expect(
      await within(dialog).findByText("비밀번호가 일치하지 않습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /회사명/ })).toBeNull();
  });

  it("비밀번호가 맞으면 입력 모드가 되고, 취소하면 보기로 돌아가 다음 수정에서 다시 묻는다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({ result: true });
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "수정" }));
    const dialog = await screen.findByRole("dialog", {
      name: "관리자 비밀번호 입력",
    });
    await user.type(
      within(dialog).getByPlaceholderText("비밀번호를 입력해주세요"),
      "right",
    );
    await user.click(within(dialog).getByRole("button", { name: "확인" }));

    expect(
      await screen.findByRole("textbox", { name: /회사명/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "취소" }));
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());

    await user.click(screen.getByRole("button", { name: "수정" }));
    expect(
      await screen.findByRole("dialog", { name: "관리자 비밀번호 입력" }),
    ).toBeInTheDocument();
  });

  it("저장에 성공하면 보기로 돌아간다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({ result: true });
    const { user, onSaved } = setup();
    await user.click(screen.getByRole("button", { name: "수정" }));
    const dialog = await screen.findByRole("dialog", {
      name: "관리자 비밀번호 입력",
    });
    await user.type(
      within(dialog).getByPlaceholderText("비밀번호를 입력해주세요"),
      "right",
    );
    await user.click(within(dialog).getByRole("button", { name: "확인" }));
    const name = await screen.findByRole("textbox", { name: /회사명/ });
    await user.clear(name);
    await user.type(name, "새 회사");
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
  });

  it("등록된 회사정보가 없으면 빈 보기와 등록 버튼으로 열리고, 비밀번호가 맞아야 입력 모드가 된다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({ result: true });
    const { user } = setup({ company: null });

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "수정" })).toBeNull();
    expect(screen.getAllByText("등록된 파일이 없습니다")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "등록" }));
    const dialog = await screen.findByRole("dialog", {
      name: "관리자 비밀번호 입력",
    });
    await user.type(
      within(dialog).getByPlaceholderText("비밀번호를 입력해주세요"),
      "right",
    );
    await user.click(within(dialog).getByRole("button", { name: "확인" }));

    expect(
      await screen.findByRole("textbox", { name: /회사명/ }),
    ).toBeInTheDocument();
  });
});
