import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { ApiError, serverApiV3 } from "@/shared/api";

import { SubAccountFormPanel } from "./SubAccountFormPanel";

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
  const handlers = { onClose: vi.fn(), onSaved: vi.fn() };
  const { container } = render(<SubAccountFormPanel {...handlers} />);
  return { handlers, container, user: userEvent.setup() };
}

function field(name: RegExp) {
  return screen.getByRole("textbox", { name });
}

async function fillAll(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field(/담당자명/), "김담당");
  await user.type(field(/아이디/), "sub_user01");
  await user.type(screen.getByLabelText("비밀번호*"), PASSWORD);
  await user.type(screen.getByLabelText("비밀번호 확인*"), PASSWORD);
  await user.type(field(/이메일/), "sub@bigbird.com");
}

async function passIdCheck(user: ReturnType<typeof userEvent.setup>) {
  await fillAll(user);
  await user.click(screen.getByRole("button", { name: "중복 확인" }));
  await screen.findByText("사용할 수 있는 아이디입니다.");
}

/** 생성 요청(multipart)의 JSON 파트와 이미지 파트. */
async function readCreateRequest() {
  const call = vi
    .mocked(serverApiV3.post)
    .mock.calls.find(([path]) => path === "/mypage/account/sub");
  const form = call?.[1] as FormData;
  const request = form.get("request") as Blob;
  return {
    body: JSON.parse(await request.text()) as unknown,
    profileImage: form.get("profileImage"),
  };
}

function rejectCreate(reason: string) {
  vi.mocked(serverApiV3.post).mockImplementation((path: string) =>
    path === "/mypage/account/check/id"
      ? Promise.resolve({ result: false })
      : Promise.reject(new ApiError(400, { result: false, reason })),
  );
}

beforeEach(() => {
  vi.mocked(toast).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(serverApiV3.post).mockReset();
  vi.mocked(serverApiV3.patch).mockReset();
  // 기본: 중복확인은 사용 가능(false), 생성은 성공.
  vi.mocked(serverApiV3.post).mockImplementation((path: string) =>
    Promise.resolve(
      path === "/mypage/account/check/id"
        ? { result: false }
        : { result: true },
    ),
  );
});

describe("SubAccountFormPanel 생성", () => {
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

  it("중복확인 응답 전에 아이디를 고치면 늦게 온 응답을 반영하지 않는다", async () => {
    let resolveCheck: (value: { result: boolean }) => void = () => {};
    vi.mocked(serverApiV3.post).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCheck = resolve;
        }),
    );
    const { user } = setup();
    await fillAll(user);
    await user.click(screen.getByRole("button", { name: "중복 확인" }));
    await user.type(field(/아이디/), "2");
    resolveCheck({ result: false });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "중복 확인" })).toBeEnabled(),
    );
    expect(screen.queryByText("사용할 수 있는 아이디입니다.")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Sub ID 생성하기" }),
    ).toBeDisabled();
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

  it("생성하면 입력을 서버 형식(휴대폰은 빈 값)으로 보내고 알린 뒤 닫는다", async () => {
    const { user, handlers } = setup();
    await passIdCheck(user);
    await user.click(screen.getByRole("button", { name: "Sub ID 생성하기" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Sub ID가 생성되었습니다."),
    );
    const { body, profileImage } = await readCreateRequest();
    expect(body).toEqual({
      id: "sub_user01",
      pw: PASSWORD,
      name: "김담당",
      email: "sub@bigbird.com",
    });
    expect(profileImage).toBeNull();
    expect(handlers.onSaved).toHaveBeenCalled();
  });

  it("고른 프로필 이미지를 생성 요청에 함께 보낸다", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const { user, container } = setup();
    const image = new File(["image"], "face.png", { type: "image/png" });
    // 파일 입력은 숨겨 두고 아바타 편집 버튼이 대신 엶.
    await user.upload(container.querySelector("input[type=file]")!, image);
    await passIdCheck(user);
    await user.click(screen.getByRole("button", { name: "Sub ID 생성하기" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Sub ID가 생성되었습니다."),
    );
    expect((await readCreateRequest()).profileImage).toBe(image);
  });

  it("이미지 저장만 실패하면 계정은 만들어졌으므로 생성으로 처리한다", async () => {
    rejectCreate("파일 업로드 도중 예외가 발생하였습니다.");
    const { user, handlers } = setup();
    await passIdCheck(user);
    await user.click(screen.getByRole("button", { name: "Sub ID 생성하기" }));
    await waitFor(() => expect(handlers.onSaved).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("그 사이 같은 아이디가 생겼으면 아이디 중복으로 알린다", async () => {
    rejectCreate("existing id");
    const { user, handlers } = setup();
    await passIdCheck(user);
    await user.click(screen.getByRole("button", { name: "Sub ID 생성하기" }));
    expect(
      await screen.findByText("중복된 아이디가 있습니다."),
    ).toBeInTheDocument();
    expect(handlers.onSaved).not.toHaveBeenCalled();
  });

  it("서버가 거부하면 실패를 알리고 닫지 않는다", async () => {
    rejectCreate("param is null");
    const { user, handlers } = setup();
    await passIdCheck(user);
    await user.click(screen.getByRole("button", { name: "Sub ID 생성하기" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "저장하지 못했습니다. 다시 시도해 주세요.",
      ),
    );
    expect(handlers.onSaved).not.toHaveBeenCalled();
  });

  it("X를 누르면 닫는다", async () => {
    const { user, handlers } = setup();
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(handlers.onClose).toHaveBeenCalled();
  });
});

describe("SubAccountFormPanel 수정", () => {
  const account = {
    accountIdx: 9000,
    identifier: "sub_user01",
    name: "김담당",
    email: "sub@bigbird.com",
    profileImageUrl: null,
    createdAt: null,
  };

  function setupEdit() {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const { container } = render(
      <SubAccountFormPanel
        account={account}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );
    return { onClose, onSaved, container, user: userEvent.setup() };
  }

  it("제목과 버튼이 수정으로 바뀌고 현재 값을 채운다(비밀번호는 빈 칸)", () => {
    setupEdit();
    expect(screen.getByText("Sub ID 수정")).toBeInTheDocument();
    expect(field(/담당자명/)).toHaveValue("김담당");
    expect(field(/아이디/)).toHaveValue("sub_user01");
    expect(field(/이메일/)).toHaveValue("sub@bigbird.com");
    expect(screen.getByLabelText("비밀번호")).toHaveValue("");
    expect(screen.queryByRole("textbox", { name: /휴대폰/ })).toBeNull();
  });

  it("비밀번호는 바꿀 때만 입력하므로 필수 표시(*)가 없다", () => {
    setupEdit();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호 확인")).toBeInTheDocument();
    expect(screen.queryByLabelText("비밀번호*")).toBeNull();
  });

  it("바꾼 것이 없으면 수정할 수 없다", () => {
    setupEdit();
    expect(screen.getByRole("button", { name: "수정하기" })).toBeDisabled();
  });

  it("아이디를 그대로 두면 중복확인 없이 바뀐 필드만 PATCH로 보낸다", async () => {
    vi.mocked(serverApiV3.patch).mockResolvedValue({ result: true });
    const { user, onSaved } = setupEdit();
    await user.clear(field(/담당자명/));
    await user.type(field(/담당자명/), "이담당");
    await user.click(screen.getByRole("button", { name: "수정하기" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [path, form] = vi.mocked(serverApiV3.patch).mock.calls[0] as [
      string,
      FormData,
    ];
    expect(path).toBe(`/mypage/account/sub/${account.accountIdx}`);
    const request = form.get("request") as Blob;
    expect(JSON.parse(await request.text())).toEqual({ name: "이담당" });
    expect(toast).toHaveBeenCalledWith("Sub ID 정보가 수정되었습니다.");
    expect(serverApiV3.post).not.toHaveBeenCalled();
  });

  it("프로필 이미지만 바꿔도 수정할 수 있고 이미지를 PATCH에 함께 보낸다", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.mocked(serverApiV3.patch).mockResolvedValue({ result: true });
    const { user, onSaved, container } = setupEdit();
    const image = new File(["image"], "face.png", { type: "image/png" });
    await user.upload(container.querySelector("input[type=file]")!, image);
    await user.click(screen.getByRole("button", { name: "수정하기" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [, form] = vi.mocked(serverApiV3.patch).mock.calls[0] as [
      string,
      FormData,
    ];
    const request = form.get("request") as Blob;
    expect(JSON.parse(await request.text())).toEqual({});
    expect(form.get("profileImage")).toBe(image);
  });

  it("수정 중 아이디가 이미 쓰이면 중복으로 안내하고 닫지 않는다", async () => {
    vi.mocked(serverApiV3.patch).mockRejectedValue(
      new ApiError(400, { result: false, reason: "existing id" }),
    );
    const { user, onSaved } = setupEdit();
    await user.clear(field(/담당자명/));
    await user.type(field(/담당자명/), "이담당");
    await user.click(screen.getByRole("button", { name: "수정하기" }));
    await waitFor(() => expect(serverApiV3.patch).toHaveBeenCalled());
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("아이디를 바꾸면 중복확인을 통과해야 수정할 수 있다", async () => {
    const { user } = setupEdit();
    await user.type(field(/아이디/), "2");
    expect(screen.getByRole("button", { name: "수정하기" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "중복 확인" }));
    await screen.findByText("사용할 수 있는 아이디입니다.");
    expect(screen.getByRole("button", { name: "수정하기" })).toBeEnabled();
  });
});
