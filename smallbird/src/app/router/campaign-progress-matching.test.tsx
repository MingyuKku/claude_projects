import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { ApiError, serverApiV3 } from "@/shared/api";

import { createFilledDetailResponse } from "./campaign-fixtures";
import { createCampaignServerFake } from "./campaign-server-fake";
import { mockV3Get, renderRoute, resetSession } from "./test-utils";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  serverApiV3: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("sonner", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  toast: Object.assign(vi.fn(), { error: vi.fn(), dismiss: vi.fn() }),
}));

const session = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "MASTER",
  service: "client",
  identifier: "tester",
  email: "test@example.com",
};

const PAID = {
  policy: {
    agreements: { service: true, privacy: true, operation: true, reward: true },
  },
  payment: { paidAmount: 11000, paidAt: "2026-11-16 10:00:00" },
};

function proposal(
  idx: number,
  status: string,
  nickname: string,
  awaitingResponseFrom: string | null = null,
) {
  return {
    proposalIdx: idx,
    threadIdx: idx,
    campaignIdx: 20,
    platformIdx: 1,
    platformId: `handle${idx}`,
    nickname,
    profileImageUrl: null,
    targetIsMember: true,
    status,
    awaitingResponseFrom,
    round: 0,
    amount: 300000,
    responseDeadline: "2099-01-01T00:00:00",
    lastMessageAt: "2026-11-27T10:00:00",
    lastMessageBody: null,
    hasUnread: false,
  };
}

const LIST = {
  result: true,
  data: [
    proposal(1, "NEGOTIATING", "하루뷰티", "ADVERTISER"),
    proposal(2, "ACCEPTED", "초록숲"),
    proposal(3, "ACCEPTED", "반려다움"),
    proposal(4, "PAID", "빅링크"),
  ],
  counts: {
    total: 128,
    proposed: 30,
    negotiating: 20,
    pendingPayment: 6,
    matched: 50,
    rejectedOrExpired: 28,
  },
  needsAttention: true,
};

const MESSAGES = {
  result: true,
  messages: [
    {
      messageIdx: 11,
      threadIdx: 1,
      body: "안녕하세요, 함께해 주세요.",
      userIdx: 3,
      attachmentIdx: null,
      writeTime: "2026-11-27T09:00:00",
      readTime: null,
      modifyTime: null,
      deleteTime: null,
      identifier: "tester",
      isUserMessage: true,
      fileName: null,
      fileSize: null,
      fileType: null,
      messageId: null,
      auto: true,
    },
    {
      messageIdx: 12,
      threadIdx: 1,
      body: "금액 조정 가능할까요?",
      userIdx: 9,
      attachmentIdx: null,
      writeTime: "2026-11-27T10:00:00",
      readTime: null,
      modifyTime: null,
      deleteTime: null,
      identifier: "haru",
      isUserMessage: false,
      fileName: null,
      fileSize: null,
      fileType: null,
      messageId: null,
      auto: false,
    },
  ],
  proposalCard: {
    campaignName: "반려다움 덴탈츄",
    campaignType: "PICK형",
    status: "NEGOTIATING",
    tag: "재협상 요청",
    currentRound: 1,
    currentAmount: 300000,
    previousAmount: 250000,
    groupBuyFeeRate: null,
    uploadScheduleStart: "2026-12-01",
    uploadScheduleEnd: "2026-12-10",
    responseDeadline: "2099-01-01T00:00:00",
  },
};

const INFO = {
  result: true,
  influencer: {
    platformIdx: 1,
    platformId: "handle1",
    nickname: "하루뷰티",
    profileImageUrl: null,
    realName: null,
    email: null,
    member: true,
  },
  campaign: {
    campaignName: "반려다움 덴탈츄",
    campaignType: "PICK형",
    progressStatus: "모집중",
    progressStartDate: "2026-12-01",
    progressEndDate: "2026-12-31",
    campaignCode: "PB00000000007823",
  },
  offer: {
    initialAmount: 250000,
    currentAmount: 300000,
    uploadScheduleStart: null,
    uploadScheduleEnd: null,
  },
  memo: null,
};

const listRequests: unknown[] = [];
let shouldListFail = false;

beforeEach(() => {
  // jsdom에는 없음. 상세 대화창이 열 때 맨 아래로 내림.
  Element.prototype.scrollIntoView = vi.fn();
  resetSession(session);
  listRequests.length = 0;
  shouldListFail = false;
  const fake = createCampaignServerFake();
  fake.seed(createFilledDetailResponse(20, { ...PAID, status: "IN_PROGRESS" }));
  fake.seed(createFilledDetailResponse(23, { ...PAID, status: "ENDED" }));
  mockV3Get((path, config) => {
    if (path === "/matching/influencer/proposal") {
      listRequests.push(config);
      return shouldListFail
        ? Promise.reject(new Error("network"))
        : Promise.resolve(LIST);
    }
    if (path === "/matching/influencer/proposal/1/messages")
      return Promise.resolve(MESSAGES);
    if (path === "/matching/influencer/proposal/1/info")
      return Promise.resolve(INFO);
    return fake.get(path, config);
  });
  vi.mocked(serverApiV3.post).mockReset();
  vi.mocked(serverApiV3.put).mockReset().mockResolvedValue({});
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast).mockClear();
});

describe("크리에이터 매칭", () => {
  it("집계와 목록을 보이고, 결제 대기만 골라 개수를 센다", async () => {
    const user = userEvent.setup();
    await renderRoute("/campaign/20/progress/matching");

    expect(await screen.findByText("128")).toBeInTheDocument();
    expect(listRequests[0]).toEqual({ params: { campaignIdx: 20 } });
    expect(screen.getAllByText("재협상 요청").length).toBeGreaterThan(0);

    const rowCheckbox = (name: string) =>
      screen.getAllByRole("checkbox", {
        name: `${name} 선택`,
      })[0] as HTMLElement;
    expect(rowCheckbox("하루뷰티")).toBeDisabled();
    expect(rowCheckbox("빅링크")).toBeDisabled();

    await user.click(rowCheckbox("초록숲"));
    await user.click(rowCheckbox("반려다움"));
    expect(screen.getByText("개 선택 됨").parentElement).toHaveTextContent(
      "2개 선택 됨",
    );
    const payButton = screen.getByRole("button", {
      name: "선택된 크리에이터 결제하기",
    });
    expect(payButton).toBeEnabled();

    // 매칭 상세보기·결제 화면은 다음 MR이라 준비 중.
    await user.click(payButton);
    expect(toast).toHaveBeenCalledWith("준비 중인 기능입니다.");
  });

  it("상태 필터를 주소에 두고 서버에 함께 보낸다", async () => {
    await renderRoute("/campaign/20/progress/matching?status=ACCEPTED&q=초록");

    await screen.findByText("128");
    expect(listRequests.at(-1)).toEqual({
      params: { campaignIdx: 20, status: "ACCEPTED", keyword: "초록" },
    });
  });

  it("종료된 캠페인은 결제를 막는다", async () => {
    await renderRoute("/campaign/23/progress/matching");

    await screen.findByText("128");
    for (const button of screen.getAllByRole("button", { name: "결제하기" }))
      expect(button).toBeDisabled();
    const list = screen.getAllByLabelText(
      "크리에이터 매칭 목록",
    )[0] as HTMLElement;
    expect(
      within(list).getAllByRole("checkbox", { name: /선택/ })[0],
    ).toBeDisabled();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "선택된 크리에이터 결제하기" }),
      ).toBeDisabled(),
    );
  });

  it("받은 목록이 있으면 다시 읽기가 실패해도 목록을 그대로 둔다", async () => {
    const router = await renderRoute("/campaign/20/progress/matching");
    await screen.findByText("128");

    shouldListFail = true;
    await router.navigate("/campaign/20/progress/matching?status=PAID");

    await waitFor(() => expect(listRequests.length).toBeGreaterThan(1));
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getAllByText("초록숲").length).toBeGreaterThan(0);
  });
});

describe("매칭 상세보기", () => {
  async function openDetail() {
    const user = userEvent.setup();
    await renderRoute("/campaign/20/progress/matching");
    await screen.findByText("128");
    await user.click(
      screen.getAllByRole("button", {
        name: "하루뷰티 매칭 내역 보기",
      })[0] as HTMLElement,
    );
    await screen.findByText("금액 조정 가능할까요?");
    return user;
  }

  it("대화와 재협상 요청 카드를 보이고 정보 탭에서 제안 정보를 보인다", async () => {
    const user = await openDetail();

    expect(screen.getByText("캠페인 제안 및 협상 단계")).toBeInTheDocument();
    expect(screen.getByText("안녕하세요, 함께해 주세요.")).toBeInTheDocument();
    expect(screen.getByText("2026.12.01 ~ 2026.12.10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "수락" })).toBeEnabled();

    await user.click(screen.getByRole("tab", { name: "크리에이터 정보" }));
    expect(await screen.findByText("250,000원")).toBeInTheDocument();
    expect(screen.getByText("모집중")).toBeInTheDocument();
  });

  it("금액을 다시 제안한다", async () => {
    const user = await openDetail();

    await user.click(screen.getByRole("button", { name: "다시 제안" }));
    const submit = screen.getByRole("button", { name: "금액 제안하기" });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText("제안 금액"), "350000");
    await user.click(submit);

    expect(serverApiV3.put).toHaveBeenCalledWith(
      "/matching/influencer/proposal/1/counter",
      { amount: 350000 },
    );
  });

  it("수락하면 이어서 결제 진행을 묻는다", async () => {
    const user = await openDetail();

    await user.click(screen.getByRole("button", { name: "수락" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "수락" }));

    expect(serverApiV3.put).toHaveBeenCalledWith(
      "/matching/influencer/proposal/1/accept",
    );
    expect(await screen.findByText("이어서 결제 진행")).toBeInTheDocument();
  });

  it("서버가 막으면(409) 안내하고 다시 읽는다", async () => {
    const user = await openDetail();
    vi.mocked(serverApiV3.put).mockRejectedValueOnce(new ApiError(409, null));

    await user.click(screen.getByRole("button", { name: "거절" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "거절" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "이미 처리됐거나 지금은 할 수 없는 요청입니다. 화면을 새로 고쳤습니다.",
      ),
    );
  });

  it("메모는 입력이 멈추면 저장한다", async () => {
    const user = await openDetail();

    await user.click(screen.getByRole("tab", { name: "크리에이터 정보" }));
    await user.type(await screen.findByLabelText("메모"), "답장 빠름");

    await waitFor(
      () =>
        expect(serverApiV3.put).toHaveBeenCalledWith(
          "/matching/influencer/proposal/1/memo",
          { memo: "답장 빠름" },
        ),
      { timeout: 3000 },
    );
  });

  it("저장한 메모는 닫았다 다시 열어도 남는다", async () => {
    const user = await openDetail();
    await user.click(screen.getByRole("tab", { name: "크리에이터 정보" }));
    await user.type(await screen.findByLabelText("메모"), "답장 빠름");
    await waitFor(
      () =>
        expect(serverApiV3.put).toHaveBeenCalledWith(
          "/matching/influencer/proposal/1/memo",
          { memo: "답장 빠름" },
        ),
      { timeout: 3000 },
    );

    await user.click(
      screen.getByRole("button", { name: "매칭 상세보기 닫기" }),
    );
    await user.click(
      screen.getAllByRole("button", {
        name: "하루뷰티 매칭 내역 보기",
      })[0] as HTMLElement,
    );
    await user.click(
      await screen.findByRole("tab", { name: "크리에이터 정보" }),
    );
    expect(await screen.findByLabelText("메모")).toHaveValue("답장 빠름");
  });
});
