import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { SWRConfig } from "swr";

import { memberApi } from "@/shared/api";

import { JoinWizard } from "./JoinWizard";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  memberApi: { get: vi.fn(), post: vi.fn() },
}));

const post = vi.mocked(memberApi.post);
const get = vi.mocked(memberApi.get);

function renderWizard(onLinkSocial = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MemoryRouter>
      <JoinWizard
        tokenData={{ platform: "kakao", email: "a@b.co", snsLinkToken: "tok" }}
        onLinkSocial={onLinkSocial}
      />
    </MemoryRouter>,
  );
  return { onLinkSocial };
}

describe("JoinWizard step gating", () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
  });

  it("shows only the verification step until certIdx exists", () => {
    renderWizard();
    expect(screen.getAllByText("본인인증하기").length).toBeGreaterThan(0);
    expect(screen.queryByText("1. 가입 정보 입력")).not.toBeInTheDocument();
  });

  it("opens the info step after verification and keeps next disabled until valid", async () => {
    const user = userEvent.setup();
    post.mockImplementation((path: string) =>
      Promise.resolve(path.startsWith("/check/id") ? { result: 0 } : {}),
    );
    renderWizard();

    await user.click(screen.getByRole("button", { name: /본인인증 건너뛰기/ }));
    expect(screen.getByText("1. 가입 정보 입력")).toBeInTheDocument();

    const next = screen.getByRole("button", { name: "다음" });
    expect(next).toBeDisabled();

    await user.type(screen.getByLabelText("아이디"), "tester01");
    await user.tab();
    expect(
      await screen.findByText("사용 가능한 아이디입니다."),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("비밀번호"), "Zq7!mkp2");
    await user.type(screen.getByLabelText("비밀번호 확인"), "Zq7!mkp2");

    expect(next).toBeEnabled();
  });
});

function nth<T>(items: T[], index: number): T {
  const item = items[index];
  if (!item) throw new Error(`요소 ${index}번이 없음`);
  return item;
}

function LocationProbe() {
  return <p data-testid="path">{useLocation().pathname}</p>;
}

function renderWizardWithRoutes(
  onLinkSocial = vi.fn().mockResolvedValue(undefined),
) {
  const view = render(
    // 회사 분류 목록은 세션 캐시라 테스트마다 새 캐시를 줌.
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter initialEntries={["/join"]}>
        <LocationProbe />
        <Routes>
          <Route
            path="/join"
            element={
              <JoinWizard
                tokenData={{
                  platform: "kakao",
                  email: "a@b.co",
                  snsLinkToken: "tok",
                }}
                onLinkSocial={onLinkSocial}
              />
            }
          />
          <Route path="*" element={null} />
        </Routes>
      </MemoryRouter>
    </SWRConfig>,
  );
  return { ...view, onLinkSocial };
}

/** 헤더의 진행 막대 폭(0~1). 막대 채움만 인라인 폭을 가짐. */
function readProgress(container: HTMLElement) {
  const bar = container.querySelector<HTMLElement>("[style*='width']");
  return bar ? parseFloat(bar.style.width) / 100 : null;
}

async function skipToInfo(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /본인인증 건너뛰기/ }));
}

async function skipToCompany(user: ReturnType<typeof userEvent.setup>) {
  await skipToInfo(user);
  await user.click(
    screen.getByRole("button", { name: /다음 단계로 건너뛰기/ }),
  );
}

async function skipToTerms(user: ReturnType<typeof userEvent.setup>) {
  await skipToCompany(user);
  await user.click(
    screen.getByRole("button", { name: /다음 단계로 건너뛰기/ }),
  );
}

describe("JoinWizard 진행·이동", () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
    get.mockResolvedValue({ category: [] });
  });

  it("단계마다 진행 막대가 1/5씩 늘어난다", async () => {
    const user = userEvent.setup();
    const { container } = renderWizardWithRoutes();
    expect(readProgress(container)).toBeCloseTo(1 / 5);

    await skipToInfo(user);
    expect(readProgress(container)).toBeCloseTo(2 / 5);
    await user.click(
      screen.getByRole("button", { name: /다음 단계로 건너뛰기/ }),
    );
    expect(readProgress(container)).toBeCloseTo(3 / 5);
    await user.click(
      screen.getByRole("button", { name: /다음 단계로 건너뛰기/ }),
    );
    expect(readProgress(container)).toBeCloseTo(4 / 5);
  });

  it("본인인증 단계의 뒤로가기는 로그인으로 나간다", async () => {
    const user = userEvent.setup();
    renderWizardWithRoutes();

    await user.click(
      nth(screen.getAllByRole("button", { name: "뒤로가기" }), 0),
    );

    expect(screen.getByTestId("path")).toHaveTextContent("/login");
  });

  it("가입 정보·회사 정보 단계의 뒤로가기도 이전 단계가 아니라 로그인으로 나간다", async () => {
    const user = userEvent.setup();
    renderWizardWithRoutes();
    await skipToCompany(user);
    expect(screen.getByText("2. 회사 정보")).toBeInTheDocument();

    await user.click(
      nth(screen.getAllByRole("button", { name: "뒤로가기" }), 0),
    );

    expect(screen.getByTestId("path")).toHaveTextContent("/login");
  });
});

describe("JoinWizard 가입 정보 단계", () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
  });

  it("비밀번호 확인이 다르면 안내하고 일치하면 일치 안내로 바뀐다", async () => {
    const user = userEvent.setup();
    renderWizardWithRoutes();
    await skipToInfo(user);

    expect(
      screen.getByText("영문, 숫자, 특수문자를 조합 8-20자로 입력해주세요."),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("비밀번호"), "Zq7!mkp2");
    await user.type(screen.getByLabelText("비밀번호 확인"), "Zq7!mkp");
    expect(
      screen.getByText("일치하지 않습니다. 다시 입력해 주세요."),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("비밀번호 확인"), "2");
    expect(screen.getByText("비밀번호가 일치합니다.")).toBeInTheDocument();
  });

  it("중복된 아이디는 안내하고 다음을 막는다", async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ result: 1 });
    renderWizardWithRoutes();
    await skipToInfo(user);

    await user.type(screen.getByLabelText("아이디"), "tester01");
    await user.tab();

    expect(
      await screen.findByText(/이미 사용 ?중인 아이디입니다/),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("비밀번호"), "Zq7!mkp2");
    await user.type(screen.getByLabelText("비밀번호 확인"), "Zq7!mkp2");
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  });

  it("서버 비밀번호 검증이 거절하면 사유를 보이고 단계를 넘기지 않는다", async () => {
    const user = userEvent.setup();
    post.mockImplementation((path: string) =>
      Promise.resolve(
        path.startsWith("/check/id")
          ? { result: 0 }
          : { result: false, reason: "id" },
      ),
    );
    renderWizardWithRoutes();
    await skipToInfo(user);
    await user.type(screen.getByLabelText("아이디"), "tester01");
    await user.tab();
    await screen.findByText(/사용 가능한 아이디입니다/);
    await user.type(screen.getByLabelText("비밀번호"), "Zq7!mkp2");
    await user.type(screen.getByLabelText("비밀번호 확인"), "Zq7!mkp2");

    await user.click(screen.getByRole("button", { name: "다음" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("2. 회사 정보")).not.toBeInTheDocument();
  });

  it("서버 검증을 통과하면 회사 정보 단계로 간다", async () => {
    const user = userEvent.setup();
    get.mockResolvedValue({ category: [] });
    post.mockImplementation((path: string) =>
      Promise.resolve(
        path.startsWith("/check/id") ? { result: 0 } : { result: true },
      ),
    );
    renderWizardWithRoutes();
    await skipToInfo(user);
    await user.type(screen.getByLabelText("아이디"), "tester01");
    await user.tab();
    await screen.findByText(/사용 가능한 아이디입니다/);
    await user.type(screen.getByLabelText("비밀번호"), "Zq7!mkp2");
    await user.type(screen.getByLabelText("비밀번호 확인"), "Zq7!mkp2");

    await user.click(screen.getByRole("button", { name: "다음" }));

    expect(await screen.findByText("2. 회사 정보")).toBeInTheDocument();
  });
});

describe("JoinWizard 회사 정보 단계", () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
    get.mockResolvedValue({
      category: [
        { id: 1, name: "패션" },
        { id: 2, name: "뷰티" },
      ],
    });
  });

  function pickFile(container: HTMLElement, index: number, file: File) {
    const inputs =
      container.querySelectorAll<HTMLInputElement>("input[type=file]");
    return userEvent.upload(nth(Array.from(inputs), index), file, {
      applyAccept: false,
    });
  }

  it("필수 항목을 모두 채우고 이메일 확인이 끝나야 다음이 열린다", async () => {
    const user = userEvent.setup();
    post.mockImplementation((path: string) =>
      Promise.resolve(path.startsWith("/check/email") ? { result: 0 } : {}),
    );
    const { container } = renderWizardWithRoutes();
    await skipToCompany(user);
    const next = screen.getByRole("button", { name: "다음" });
    expect(next).toBeDisabled();

    await user.type(screen.getByLabelText("회사명"), "빅링크");
    // 본인인증에서 받은 번호가 채워져 있고, 지우고 다시 입력할 수 있음.
    expect(screen.getByLabelText("담당자 연락처")).toHaveValue("01000000000");
    await user.clear(screen.getByLabelText("담당자 연락처"));
    await user.type(screen.getByLabelText("담당자 연락처"), "010-1234-5678");
    expect(screen.getByLabelText("담당자 연락처")).toHaveValue("01012345678");
    await user.type(screen.getByLabelText("사업자 등록번호"), "12345678901");
    expect(screen.getByLabelText("사업자 등록번호")).toHaveValue("1234567890");
    // 이메일은 입력을 멈춘 지 300ms 뒤에 자동으로 중복확인함.
    await user.type(screen.getByLabelText("이메일"), "a@b.co");
    expect(
      await screen.findByText(/사용 가능한 이메일입니다/),
    ).toBeInTheDocument();
    expect(next).toBeDisabled();

    await pickFile(
      container,
      0,
      new File(["x"], "license.pdf", { type: "application/pdf" }),
    );
    expect(await screen.findByText("license.pdf")).toBeInTheDocument();
    expect(next).toBeEnabled();
  });

  it("허용하지 않는 형식과 5MB를 넘는 파일은 올리지 않고 안내한다", async () => {
    renderWizardWithRoutes();
    const user = userEvent.setup();
    await skipToCompany(user);
    const view = { container: document.body };

    await pickFile(
      view.container,
      0,
      new File(["x"], "doc.exe", { type: "application/octet-stream" }),
    );
    expect(
      await screen.findByText("이미지 또는 PDF 파일만 선택할 수 있습니다"),
    ).toBeInTheDocument();

    const big = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });
    await pickFile(view.container, 0, big);
    expect(
      await screen.findByText("파일 용량은 5MB 이하만 업로드 가능합니다"),
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("업로드 요청이 실패하면 오류를 보이고 파일명을 채우지 않는다", async () => {
    const user = userEvent.setup();
    post.mockRejectedValue(new Error("fail"));
    renderWizardWithRoutes();
    await skipToCompany(user);

    await pickFile(
      document.body,
      0,
      new File(["x"], "license.png", { type: "image/png" }),
    );

    expect(
      await screen.findByText("파일업로드 오류가 발생하였습니다"),
    ).toBeInTheDocument();
    expect(screen.queryByText("license.png")).not.toBeInTheDocument();
  });

  it("업로드가 실패한 뒤 같은 파일을 다시 골라도 다시 올린다", async () => {
    const user = userEvent.setup();
    post.mockRejectedValueOnce(new Error("fail")).mockResolvedValue({});
    renderWizardWithRoutes();
    await skipToCompany(user);
    const file = new File(["x"], "license.png", { type: "image/png" });

    await pickFile(document.body, 0, file);
    await screen.findByText("파일업로드 오류가 발생하였습니다");
    await pickFile(document.body, 0, file);

    expect(await screen.findByText("license.png")).toBeInTheDocument();
    expect(
      screen.queryByText("파일업로드 오류가 발생하였습니다"),
    ).not.toBeInTheDocument();
  });

  it("회사 분류를 목록에서 고르면 선택한 값이 보인다", async () => {
    const user = userEvent.setup();
    renderWizardWithRoutes();
    await skipToCompany(user);

    await user.click(screen.getByRole("button", { name: /대분류/ }));
    await user.click(await screen.findByRole("option", { name: "뷰티" }));

    expect(screen.getByRole("button", { name: /뷰티/ })).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("회사 URL 형식이 틀리면 포커스를 벗어날 때 안내한다", async () => {
    const user = userEvent.setup();
    renderWizardWithRoutes();
    await skipToCompany(user);

    await user.type(screen.getByLabelText("회사 URL"), "not a url");
    await user.tab();

    expect(screen.getByText("올바른 URL 형식이 아닙니다.")).toBeInTheDocument();
  });
});

describe("JoinWizard 약관 단계", () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
    get.mockResolvedValue({ category: [] });
  });

  it("전체 동의는 두 항목을 함께 켜고 끄며, 한 항목을 끄면 전체도 꺼진다", async () => {
    const user = userEvent.setup();
    renderWizardWithRoutes();
    await skipToTerms(user);
    const all = screen.getByRole("checkbox", { name: /모든 항목에 동의/ });
    const service = screen.getByRole("checkbox", { name: /이용약관 동의/ });
    const privacy = screen.getByRole("checkbox", { name: /개인정보처리방침/ });

    await user.click(all);
    expect(all).toBeChecked();
    expect(service).toBeChecked();
    expect(privacy).toBeChecked();

    await user.click(service);
    expect(all).not.toBeChecked();
    expect(privacy).toBeChecked();
  });

  it("보기로 전문을 열고 동의하기를 누르면 목록으로 돌아와 그 항목이 체크된다", async () => {
    const user = userEvent.setup();
    renderWizardWithRoutes();
    await skipToTerms(user);

    await user.click(nth(screen.getAllByRole("button", { name: /보기$/ }), 0));
    expect(screen.getByText("이용약관동의")).toBeInTheDocument();
    expect(screen.queryByText("3. 약관 동의")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "동의하기" }));

    expect(screen.getByText("3. 약관 동의")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /이용약관 동의/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /개인정보처리방침/ }),
    ).not.toBeChecked();
  });

  it("전문 화면의 뒤로가기는 로그인이 아니라 약관 목록으로 돌아간다", async () => {
    const user = userEvent.setup();
    renderWizardWithRoutes();
    await skipToTerms(user);
    await user.click(nth(screen.getAllByRole("button", { name: /보기$/ }), 1));

    await user.click(
      nth(screen.getAllByRole("button", { name: "뒤로가기" }), 0),
    );

    expect(screen.getByText("3. 약관 동의")).toBeInTheDocument();
    expect(screen.getByTestId("path")).toHaveTextContent("/join");
  });

  it("두 약관에 모두 동의해야 환영합니다가 열리고, 가입하면 SNS를 연동하고 완료로 이동한다", async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ result: "success", userIdx: 7 });
    const { onLinkSocial } = renderWizardWithRoutes();
    await skipToTerms(user);
    const submit = screen.getByRole("button", { name: "환영합니다" });
    expect(submit).toBeDisabled();

    await user.click(
      screen.getByRole("checkbox", { name: /모든 항목에 동의/ }),
    );
    await user.click(submit);

    await waitFor(() =>
      expect(screen.getByTestId("path")).toHaveTextContent("/welcome"),
    );
    expect(onLinkSocial).toHaveBeenCalledWith(
      expect.objectContaining({ snsLinkToken: "tok" }),
    );
  });

  it("가입이 실패하면 안내하고 완료로 이동하지 않는다", async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({ result: "fail" });
    renderWizardWithRoutes();
    await skipToTerms(user);

    await user.click(
      screen.getByRole("checkbox", { name: /모든 항목에 동의/ }),
    );
    await user.click(screen.getByRole("button", { name: "환영합니다" }));

    expect(await screen.findByText("가입 실패하였습니다")).toBeInTheDocument();
    expect(screen.getByTestId("path")).toHaveTextContent("/join");
  });
});
