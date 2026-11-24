import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";

import { ROUTES } from "@/shared/config";

import { SnsLinkPage } from "./SnsLinkPage";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

const snsData = {
  platform: "kakao",
  email: "a@b.com",
  snsLinkToken: "signed-token",
};

function StateProbe({ label }: { label: string }) {
  const { state } = useLocation();
  return (
    <p>
      {label} {JSON.stringify(state)}
    </p>
  );
}

function renderPage(state: unknown = { snsData }) {
  const router = createMemoryRouter(
    [
      { path: ROUTES.snsLink, element: <SnsLinkPage /> },
      { path: ROUTES.join, element: <StateProbe label="join page" /> },
      { path: ROUTES.find, element: <p>find page</p> },
      { path: ROUTES.login, element: <p>login page</p> },
      { path: ROUTES.main, element: <p>main page</p> },
    ],
    { initialEntries: [{ pathname: ROUTES.snsLink, state }] },
  );
  render(<RouterProvider router={router} />);
  return userEvent.setup();
}

async function openLinkTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("tab", { name: "SNS 계정 연동" }));
}

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  id: string,
  password: string,
) {
  await user.type(screen.getByLabelText("아이디"), id);
  await user.type(screen.getByLabelText("비밀번호"), password);
  await user.click(screen.getByRole("button", { name: "로그인" }));
}

describe("SnsLinkPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("가입하기 탭이 기본이고 가입하기를 누르면 신원 토큰을 들고 가입 화면으로 간다", async () => {
    const user = renderPage();
    expect(screen.getByRole("tab", { name: "가입하기" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "가입하기" }));

    expect(await screen.findByText(/join page/)).toHaveTextContent(
      "signed-token",
    );
  });

  it("직접 연 화면은 토큰 없이 가입 화면으로 간다", async () => {
    const user = renderPage(null);
    await user.click(screen.getByRole("button", { name: "가입하기" }));

    expect(await screen.findByText(/join page/)).toHaveTextContent(
      '"tokenData":null',
    );
  });

  it("탭을 누르면 연동 탭으로 바뀌고 아이디·비밀번호 입력이 나온다", async () => {
    const user = renderPage();
    await openLinkTab(user);

    expect(screen.getByRole("tab", { name: "SNS 계정 연동" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByLabelText("아이디")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
  });

  it("빈 값이면 서버를 부르지 않고 안내한다", async () => {
    const user = renderPage();
    await openLinkTab(user);
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "아이디/비밀번호를 모두 입력해 주세요",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("연동에 성공하고 세션이 열리면 홈으로 간다", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ items: [] }))
      .mockResolvedValueOnce(jsonResponse({ result: true, userIdx: 3 }));
    const user = renderPage();
    await openLinkTab(user);
    await fillAndSubmit(user, "tester", "pw1234!");

    expect(await screen.findByText("main page")).toBeInTheDocument();
  });

  it("승인 전 계정은 연동 실패 문구 없이 로그인 화면으로 간다", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ items: [] }))
      .mockResolvedValueOnce(jsonResponse({ result: false }));
    const user = renderPage();
    await openLinkTab(user);
    await fillAndSubmit(user, "tester", "pw1234!");

    expect(await screen.findByText("login page")).toBeInTheDocument();
  });

  it("아이디·비밀번호 불일치는 불일치 문구를 보인다", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ result: false, reason: "INVALID_CREDENTIALS" }, 401),
    );
    const user = renderPage();
    await openLinkTab(user);
    await fillAndSubmit(user, "tester", "bad");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "입력하신 아이디와 비밀번호가 등록된 정보와 일치하지 않습니다",
    );
  });

  it("그 밖의 연동 실패는 관리자 문의 문구를 보인다", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ reason: "SNS_ALREADY_LINKED" }, 409),
    );
    const user = renderPage();
    await openLinkTab(user);
    await fillAndSubmit(user, "tester", "pw");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "연동되지 않았습니다. 관리자에게 문의해주세요",
    );
  });

  it("신원 정보 없이 연 화면은 서버를 부르지 않고 안내한다", async () => {
    const user = renderPage(null);
    await openLinkTab(user);
    await fillAndSubmit(user, "tester", "pw");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "SNS 연동 정보가 없습니다",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("연동 요청 중에는 로그인 버튼이 눌리지 않는다", async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const user = renderPage();
    await openLinkTab(user);
    await fillAndSubmit(user, "tester", "pw");

    expect(screen.getByRole("button", { name: "로그인" })).toBeDisabled();
    resolveFetch(jsonResponse({ reason: "SNS_ALREADY_LINKED" }, 409));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("아이디·비밀번호 찾기는 쿼리 없이 찾기 화면으로 간다", async () => {
    const user = renderPage();
    await openLinkTab(user);
    await user.click(screen.getByRole("button", { name: "아이디 찾기" }));

    expect(await screen.findByText("find page")).toBeInTheDocument();
  });

  it("되돌아가기는 로그인 화면으로 간다 (가입하기 탭)", async () => {
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "되돌아가기" }));

    expect(await screen.findByText("login page")).toBeInTheDocument();
  });

  it("되돌아가기는 로그인 화면으로 간다 (연동 탭)", async () => {
    const user = renderPage();
    await openLinkTab(user);
    await user.click(screen.getByRole("button", { name: "되돌아가기" }));

    expect(await screen.findByText("login page")).toBeInTheDocument();
  });

  it("연동 탭의 오류 문구는 입력창과 연결되고 탭을 바꾸면 사라진다", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ reason: "SNS_ALREADY_LINKED" }, 409),
    );
    const user = renderPage();
    await openLinkTab(user);
    await fillAndSubmit(user, "tester", "pw");

    const alert = await screen.findByRole("alert");
    expect(screen.getByLabelText("아이디")).toHaveAccessibleDescription(
      alert.textContent ?? "",
    );

    await user.click(screen.getByRole("tab", { name: "가입하기" }));
    await openLinkTab(user);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("약관 링크는 이동 없이 약관 다이얼로그를 열고 확인으로 닫는다", async () => {
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "개인정보처리방침" }));

    expect(
      await screen.findByRole("dialog", { name: "개인정보처리방침" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "확인" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("tab", { name: "가입하기" })).toBeInTheDocument();
  });

  it("이용약관 링크는 서비스 이용약관을 연다", async () => {
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "이용약관" }));

    expect(
      await screen.findByRole("dialog", { name: "이용약관" }),
    ).toBeInTheDocument();
  });
});
