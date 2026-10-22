import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { ApiError, serverApiV3 } from "@/shared/api";

import { CreateSubAccountPanel } from "./CreateSubAccountPanel";

import type * as SharedApi from "@/shared/api";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const PASSWORD = "Wq!9a2k7xZ";

function setup() {
  const handlers = { onClose: vi.fn(), onCreated: vi.fn() };
  render(<CreateSubAccountPanel {...handlers} />);
  return { handlers, user: userEvent.setup() };
}

function field(name: RegExp) {
  return screen.getByRole("textbox", { name });
}

async function fillAll(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field(/담당자명/), "김담당");
  await user.type(field(/아이디/), "sub_user01");
  await user.type(screen.getByLabelText("비밀번호*"), PASSWORD);
  await user.type(screen.getByLabelText("비밀번호 확인*"), PASSWORD);
  await user.type(field(/휴대폰 번호/), "010-1234-5678");
  await user.type(field(/이메일/), "sub@bigbird.com");
}

beforeEach(() => {
  vi.mocked(toast).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(serverApiV3.post).mockReset();
  // 기본: 중복확인은 사용 가능(false), 생성은 성공.
  vi.mocked(serverApiV3.post).mockImplementation((path: string) =>
    Promise.resolve(
      path === "/mypage/account/check/id"
        ? { result: false }
        : { result: true },
    ),
  );
});

describe("CreateSubAccountPanel", () => {
  it("모두 채워도 아이디 중복확인 전에는 생성할 수 없다", async () => {
    const { user } = setup();
    await fillAll(user);
    expect(
      screen.getByRole("button", { name: "Sub ID 생성하기" }),
    ).toBeDisabled();
  });

  it("중복확인을 통과하면 안내를 보이고 생성할 수 있다", async () => {
    const { user } = setup();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "중복 확인" }));
    expect(
      await screen.findByText("사용할 수 있는 아이디입니다."),
    ).toBeInTheDocument();
    expect(serverApiV3.post).toHaveBeenCalledWith("/mypage/account/check/id", {
      data: "sub_user01",
    });
    expect(
      screen.getByRole("button", { name: "Sub ID 생성하기" }),
    ).toBeEnabled();
  });

  it("이미 쓰는 아이디면 오류를 보이고 생성할 수 없다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({ result: true });
    const { user } = setup();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "중복 확인" }));
    expect(
      await screen.findByText("중복된 아이디가 있습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sub ID 생성하기" }),
    ).toBeDisabled();
  });

  it("아이디를 고치면 통과 상태가 풀려 다시 확인해야 한다", async () => {
    const { user } = setup();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "중복 확인" }));
    await screen.findByText("사용할 수 있는 아이디입니다.");
    await user.type(field(/아이디/), "2");
    expect(
      screen.queryByText("사용할 수 있는 아이디입니다."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sub ID 생성하기" }),
    ).toBeDisabled();
  });

  it("형식에 맞지 않는 아이디는 형식 안내를 보이고 눌러도 서버에 묻지 않는다", async () => {
    const { user } = setup();
    await user.type(field(/아이디/), "ab");
    expect(
      screen.getByText(
        "영문, 숫자, 밑줄, 점을 이용하여 6-20자로 입력해 주세요.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "중복 확인" }));
    expect(serverApiV3.post).not.toHaveBeenCalled();
  });

  it("아이디가 비어 있을 때 눌러도 서버에 묻지 않는다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "중복 확인" }));
    expect(serverApiV3.post).not.toHaveBeenCalled();
  });

  it("형식은 맞는데 확인하지 않은 아이디는 확인을 요구한다", async () => {
    const { user } = setup();
    await user.type(field(/아이디/), "sub_user01");
    await user.tab();
    expect(
      screen.getByText("아이디 중복 확인이 필요합니다."),
    ).toBeInTheDocument();
  });

  it("비밀번호 확인이 다르면 불일치 문구를 보인다", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("비밀번호*"), PASSWORD);
    await user.type(screen.getByLabelText("비밀번호 확인*"), "different");
    expect(
      screen.getByText("비밀번호가 일치하지 않습니다."),
    ).toBeInTheDocument();
  });

  it("생성하면 입력을 서버 형식(휴대폰 숫자만)으로 보내고 알린 뒤 닫는다", async () => {
    const { user, handlers } = setup();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "중복 확인" }));
    await screen.findByText("사용할 수 있는 아이디입니다.");
    await user.click(screen.getByRole("button", { name: "Sub ID 생성하기" }));
    await waitFor(() =>
      expect(serverApiV3.post).toHaveBeenCalledWith("/mypage/account/sub", {
        id: "sub_user01",
        pw: PASSWORD,
        name: "김담당",
        email: "sub@bigbird.com",
        phone: "01012345678",
      }),
    );
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Sub ID가 생성되었습니다."),
    );
    expect(handlers.onCreated).toHaveBeenCalled();
  });

  it("서버가 거부하면 실패를 알리고 닫지 않는다", async () => {
    vi.mocked(serverApiV3.post).mockImplementation((path: string) =>
      path === "/mypage/account/check/id"
        ? Promise.resolve({ result: false })
        : Promise.reject(
            new ApiError(400, { result: false, reason: "param is null" }),
          ),
    );
    const { user, handlers } = setup();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "중복 확인" }));
    await screen.findByText("사용할 수 있는 아이디입니다.");
    await user.click(screen.getByRole("button", { name: "Sub ID 생성하기" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "저장하지 못했습니다. 다시 시도해 주세요.",
      ),
    );
    expect(handlers.onCreated).not.toHaveBeenCalled();
  });

  it("X를 누르면 닫는다", async () => {
    const { user, handlers } = setup();
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(handlers.onClose).toHaveBeenCalled();
  });
});
