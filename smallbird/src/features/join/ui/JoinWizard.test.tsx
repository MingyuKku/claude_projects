import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

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
        tokenData={{ platform: "kakao", email: "a@b.co", uid: "1" }}
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
      await screen.findByText("사용 가능한 아이디입니다"),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("비밀번호"), "Zq7!mkp2");
    await user.type(screen.getByLabelText("비밀번호 확인"), "Zq7!mkp2");

    expect(next).toBeEnabled();
  });
});
