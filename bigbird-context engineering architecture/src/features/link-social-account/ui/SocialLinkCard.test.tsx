import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { SocialLinkCard } from "./SocialLinkCard";

import type { SocialLinkViewModel, SocialProvider } from "@/entities/account";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

beforeEach(() => {
  vi.mocked(toast).mockReset();
});

const LINKED: SocialLinkViewModel = { isLinked: true, email: null };
const UNLINKED: SocialLinkViewModel = { isLinked: false, email: null };

function setup() {
  const links: Record<SocialProvider, SocialLinkViewModel> = {
    kakao: LINKED,
    naver: LINKED,
    facebook: LINKED,
    google: UNLINKED,
    apple: UNLINKED,
  };
  render(<SocialLinkCard links={links} />);
  return userEvent.setup();
}

describe("SocialLinkCard", () => {
  it("5개 SNS를 시안 순서로 보이고 연동 상태를 스위치로 나타낸다", () => {
    setup();
    const switches = screen.getAllByRole("switch");
    expect(switches.map((item) => item.getAttribute("aria-label"))).toEqual([
      "카카오 간편 로그인 연동",
      "네이버 간편 로그인 연동",
      "페이스북 간편 로그인 연동",
      "구글 간편 로그인 연동",
      "애플 간편 로그인 연동",
    ]);
    expect(switches.map((item) => item.getAttribute("aria-checked"))).toEqual([
      "true",
      "true",
      "true",
      "false",
      "false",
    ]);
  });

  it("켜면 준비 중으로 안내하고 값은 그대로 둔다", async () => {
    const user = setup();
    const toggle = screen.getByRole("switch", {
      name: "구글 간편 로그인 연동",
    });
    await user.click(toggle);
    expect(toast).toHaveBeenCalledWith("준비 중인 기능입니다.");
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("끄면 해제 확인 알럿을 열고, 확정하면 준비 중으로 안내한다", async () => {
    const user = setup();
    const toggle = screen.getByRole("switch", {
      name: "카카오 간편 로그인 연동",
    });
    await user.click(toggle);

    const dialog = screen.getByRole("alertdialog", {
      name: "간편 로그인 해제",
    });
    expect(dialog).toHaveTextContent(
      "카카오 간편 로그인 연동을 해제하시겠습니까?",
    );
    expect(toast).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "해제" }));
    expect(toast).toHaveBeenCalledWith("준비 중인 기능입니다.");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("알럿에서 취소하면 안내 없이 닫는다", async () => {
    const user = setup();
    await user.click(
      screen.getByRole("switch", { name: "네이버 간편 로그인 연동" }),
    );
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(toast).not.toHaveBeenCalled();
  });
});
