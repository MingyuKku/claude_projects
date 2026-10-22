import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { CompanyInfoForm } from "./CompanyInfoForm";

import type { CompanyInfoViewModel } from "@/entities/account";
import type * as SharedApi from "@/shared/api";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() },
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
  const { container } = render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <CompanyInfoForm
        company={props.company === undefined ? company : props.company}
        onSaved={onSaved}
      />
    </SWRConfig>,
  );
  // 형식이 틀린 파일도 컴포넌트까지 오게 accept 필터를 끔.
  return { container, onSaved, user: userEvent.setup({ applyAccept: false }) };
}

function fileInputs(container: HTMLElement) {
  return container.querySelectorAll<HTMLInputElement>('input[type="file"]');
}

const pdf = new File(["x"], "license.pdf", { type: "application/pdf" });

beforeEach(() => {
  vi.mocked(toast).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(serverApiV3.get)
    .mockReset()
    .mockResolvedValue({ category: [{ idx: 3, name: "패션/의류" }] });
  vi.mocked(serverApiV3.put).mockReset().mockResolvedValue({ result: true });
  vi.mocked(serverApiV3.post).mockReset().mockResolvedValue({ result: true });
});

describe("CompanyInfoForm", () => {
  it("필수 항목이 모두 차 있으면 저장할 수 있다", () => {
    setup();
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();
  });

  it("필수 항목을 비우면 저장할 수 없다", async () => {
    const { user } = setup();
    await user.clear(screen.getByRole("textbox", { name: /회사명/ }));
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("등록된 서류는 서버가 준 파일명으로 보인다", () => {
    setup();
    expect(screen.getByRole("textbox", { name: /사업자 등록증/ })).toHaveValue(
      "사업자등록증.pdf",
    );
    expect(
      screen.getByRole("textbox", { name: /통신판매업 신고증/ }),
    ).toHaveValue("신고증.png");
  });

  it("서류는 등록됐는데 서버가 파일명을 주지 않으면 등록됨으로 보인다", () => {
    setup({
      company: {
        ...company,
        businessRegistrationFileName: null,
        mailorderFileName: null,
      },
    });
    expect(screen.getAllByDisplayValue("등록됨")).toHaveLength(2);
  });

  it("회사정보가 없는 계정은 텍스트를 채워도 서류를 고르기 전에는 저장할 수 없다", async () => {
    const { user, container } = setup({ company: null });
    for (const [name, value] of [
      [/회사명/, "빅버드"],
      [/연락처/, "01012345678"],
      [/사업자 등록 번호/, "123"],
      [/통신판매번호/, "2024-1"],
    ] as const) {
      await user.type(screen.getByRole("textbox", { name }), value);
    }
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    const [registration, mailorder] = fileInputs(container);
    await user.upload(registration!, pdf);
    await user.upload(mailorder!, pdf);
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();
  });

  it("허용하지 않는 형식의 파일은 오류 문구를 보이고 고르지 않는다", async () => {
    const { user, container } = setup();
    await user.upload(
      fileInputs(container)[0]!,
      new File(["x"], "a.gif", { type: "image/gif" }),
    );
    expect(
      screen.getByText("JPG, PNG, PDF 파일만 업로드할 수 있습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByDisplayValue("a.gif")).toBeNull();
  });

  it("저장하면 이미 등록돼 있어 수정(PUT)하고 고른 서류를 올린 뒤 알린다", async () => {
    const { user, container, onSaved } = setup();
    await user.upload(fileInputs(container)[0]!, pdf);
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(serverApiV3.put).toHaveBeenCalledWith(
        "/mypage/account/extra",
        expect.objectContaining({
          companyName: "주식회사 빅버드",
          category: 3,
        }),
      ),
    );
    await waitFor(() =>
      expect(serverApiV3.post).toHaveBeenCalledWith(
        "/mypage/account/extra/registration/upload",
        expect.any(FormData),
      ),
    );
    expect(serverApiV3.post).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(toast).toHaveBeenCalledWith("저장되었습니다."));
    expect(onSaved).toHaveBeenCalled();
    // 방금 올린 서류는 조회가 갱신되기 전에도 새 파일명으로 보인다.
    expect(screen.getByRole("textbox", { name: /사업자 등록증/ })).toHaveValue(
      "license.pdf",
    );
    expect(
      screen.getByRole("textbox", { name: /통신판매업 신고증/ }),
    ).toHaveValue("신고증.png");
  });

  it("회사정보 저장이 실패하면 올리지 않은 서류의 이름을 기억하지 않는다", async () => {
    vi.mocked(serverApiV3.put).mockResolvedValue({ result: false });
    const { user, container } = setup();
    await user.upload(fileInputs(container)[0]!, pdf);
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.getByRole("textbox", { name: /사업자 등록증/ })).toHaveValue(
      "사업자등록증.pdf",
    );
    expect(serverApiV3.post).not.toHaveBeenCalled();
  });

  it("서버가 업로드 형식을 거부하면 해당 칸에 오류를 보이고 실패를 알린다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: false,
      reason: "fail image upload",
    });
    const { user, container, onSaved } = setup();
    await user.upload(fileInputs(container)[0]!, pdf);
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "저장하지 못했습니다. 다시 시도해 주세요.",
      ),
    );
    expect(
      screen.getByText("JPG, PNG, PDF 파일만 업로드할 수 있습니다."),
    ).toBeInTheDocument();
    // 회사정보 텍스트는 이미 저장됐으므로 화면은 다시 읽음.
    expect(onSaved).toHaveBeenCalled();
  });

  it("취소하면 입력을 불러온 값으로 되돌린다", async () => {
    const { user } = setup();
    const name = screen.getByRole("textbox", { name: /회사명/ });
    await user.type(name, " 추가");
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(name).toHaveValue("주식회사 빅버드");
  });
});
