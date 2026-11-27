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

function guideResponse(patch: Record<string, unknown> = {}) {
  return {
    idx: 1,
    campaignIdx: 20,
    creationMethod: "MANUAL",
    postingCount: 1,
    minPhotoCount: 2,
    minVideoCount: 1,
    photoType: "REQUIRED",
    videoType: null,
    requiredKeywords: ["수분크림"],
    requiredHashtags: ["초록숲"],
    notice: null,
    referenceUrls: [],
    contentGuide: "반려견이 먹는 모습을 담아 주세요.",
    examples: [],
    status: "DRAFT",
    aiGeneratedAt: null,
    confirmedAt: null,
    needsAttention: true,
    ...patch,
  };
}

let guide: Record<string, unknown> | null;
let mockPreview: Record<string, unknown> | null;
let isAiPaid: boolean;

// 20 진행 중 · 23 종료
beforeEach(() => {
  resetSession(session);
  guide = null;
  mockPreview = null;
  isAiPaid = false;
  const fake = createCampaignServerFake();
  fake.seed(createFilledDetailResponse(20, { ...PAID, status: "IN_PROGRESS" }));
  fake.seed(createFilledDetailResponse(23, { ...PAID, status: "ENDED" }));
  mockV3Get((path, config) => {
    if (/\/posting-guide\/payment$/.test(path))
      return Promise.resolve({
        cost: 10000,
        totalAmount: 10000,
        paymentMethod: "빅버드 머니",
        balance: 0,
        shortfallAmount: 10000,
        alreadyPaid: isAiPaid,
      });
    if (/\/posting-guide\/preview$/.test(path))
      return mockPreview
        ? Promise.resolve(mockPreview)
        : Promise.reject(new ApiError(404, { result: false }));
    if (/\/posting-guide$/.test(path))
      return guide
        ? Promise.resolve(guide)
        : Promise.reject(new ApiError(404, { result: false }));
    return fake.get(path, config);
  });
  vi.mocked(serverApiV3.post).mockReset();
  vi.mocked(serverApiV3.put).mockReset();
  vi.mocked(toast).mockClear();
});

describe("포스팅 가이드", () => {
  it("처음이면 직접 작성으로 시작해 필수 값을 채운 뒤 임시저장한다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.post).mockResolvedValue(guideResponse());
    vi.mocked(serverApiV3.put).mockResolvedValue(guideResponse());
    await renderRoute("/campaign/20/progress/guide");

    const manual = await screen.findByRole("radio", { name: /직접 작성하기/ });
    expect(manual).toBeChecked();
    expect(screen.getAllByText("결제 필요")).not.toHaveLength(0);
    const [confirmButton] = screen.getAllByRole("button", {
      name: "가이드 확정",
    });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByLabelText(/사진 수/), "2");
    await user.type(screen.getByLabelText(/영상 수/), "1");
    await user.type(screen.getByLabelText(/필수 키워드/), " #수분크림{Enter}");
    await user.type(screen.getByLabelText(/필수 해시태그/), "초록숲{Enter}");
    // 예시 탭의 콘텐츠 개요도 필수(*).
    expect(confirmButton).toBeDisabled();
    await user.click(
      screen.getByRole("tab", { name: "예시 이미지/영상 첨부" }),
    );
    await user.type(screen.getByLabelText(/콘텐츠 개요/), "사용 후기");
    expect(confirmButton).toBeEnabled();

    const [saveButton] = screen.getAllByRole("button", { name: "임시저장" });
    await user.click(saveButton as HTMLElement);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("임시 저장이 완료되었습니다."),
    );
    expect(serverApiV3.post).toHaveBeenCalledWith(
      "/campaign/20/posting-guide",
      { creationMethod: "MANUAL" },
    );
    expect(serverApiV3.put).toHaveBeenCalledWith(
      "/campaign/20/posting-guide/basic-condition",
      {
        postingCount: 1,
        minPhotoCount: 2,
        minVideoCount: 1,
        requiredKeywords: ["수분크림"],
        requiredHashtags: ["초록숲"],
        notice: null,
        referenceUrls: [],
        photoType: null,
        videoType: null,
      },
    );
    expect(serverApiV3.put).toHaveBeenCalledWith(
      "/campaign/20/posting-guide/examples",
      { contentGuide: "사용 후기" },
    );
  });

  it("확정은 묻고 나서 저장·확정하고, 확정 뒤에는 고칠 수 없다", async () => {
    const user = userEvent.setup();
    guide = guideResponse();
    vi.mocked(serverApiV3.put).mockImplementation((path) =>
      Promise.resolve(
        guideResponse(
          path.endsWith("/confirm")
            ? { status: "CONFIRMED", confirmedAt: "2026-11-27T10:00:00" }
            : {},
        ),
      ),
    );
    await renderRoute("/campaign/20/progress/guide");

    const [confirmButton] = await screen.findAllByRole("button", {
      name: "가이드 확정",
    });
    await user.click(confirmButton as HTMLElement);
    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText("포스팅 가이드 등록 완료"),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "확인" }));

    await waitFor(() =>
      expect(serverApiV3.put).toHaveBeenCalledWith(
        "/campaign/20/posting-guide/confirm",
      ),
    );
    // 이미 있는 가이드라 다시 만들지 않고, 받은 사진·영상 필수 여부는 그대로 돌려 보냄.
    expect(serverApiV3.post).not.toHaveBeenCalled();
    expect(serverApiV3.put).toHaveBeenCalledWith(
      "/campaign/20/posting-guide/basic-condition",
      expect.objectContaining({ photoType: "REQUIRED" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText(/사진 수/)).toBeDisabled(),
    );
  });

  it("서버 방식과 다른 카드로 저장하면 방식을 먼저 바꾼다", async () => {
    const user = userEvent.setup();
    guide = guideResponse({ creationMethod: "AI" });
    vi.mocked(serverApiV3.post).mockResolvedValue(guideResponse());
    vi.mocked(serverApiV3.put).mockResolvedValue(guideResponse());
    await renderRoute("/campaign/20/progress/guide");

    expect(
      await screen.findByRole("radio", { name: /AI 포스팅 가이드 작성/ }),
    ).toBeChecked();
    await user.click(screen.getByRole("radio", { name: /직접 작성하기/ }));
    const [saveButton] = screen.getAllByRole("button", { name: "임시저장" });
    await user.click(saveButton as HTMLElement);

    await waitFor(() =>
      expect(serverApiV3.put).toHaveBeenCalledWith(
        "/campaign/20/posting-guide/basic-condition",
        expect.anything(),
      ),
    );
    expect(serverApiV3.post).toHaveBeenCalledWith(
      "/campaign/20/posting-guide",
      { creationMethod: "MANUAL" },
    );
  });

  it("건너뛰면 다음 단계(크리에이터 탐색)로 간다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.post).mockResolvedValue(
      guideResponse({ status: "SKIPPED", needsAttention: false }),
    );
    const router = await renderRoute("/campaign/20/progress/guide");

    const [skipButton] = await screen.findAllByRole("button", {
      name: "건너뛰기",
    });
    await user.click(skipButton as HTMLElement);
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "건너뛰기" }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        "/campaign/20/progress/search",
      ),
    );
    expect(serverApiV3.post).toHaveBeenCalledWith(
      "/campaign/20/posting-guide/skip",
    );
  });

  it("AI를 결제했으면 AI로 시작하고, 생성하기는 준비 중이다", async () => {
    const user = userEvent.setup();
    isAiPaid = true;
    await renderRoute("/campaign/20/progress/guide");

    expect(
      await screen.findByRole("radio", { name: /AI 포스팅 가이드 작성/ }),
    ).toBeChecked();
    const [generateButton] = screen.getAllByRole("button", {
      name: "AI 포스팅 가이드 생성하기",
    });
    await user.click(generateButton as HTMLElement);

    expect(toast).toHaveBeenCalledWith("준비 중인 기능입니다.");
    expect(serverApiV3.post).not.toHaveBeenCalled();
  });

  it("종료된 캠페인은 조회만 한다", async () => {
    guide = guideResponse();
    await renderRoute("/campaign/23/progress/guide");

    expect(await screen.findByLabelText(/사진 수/)).toBeDisabled();
    for (const button of screen.getAllByRole("button", { name: "임시저장" }))
      expect(button).toBeDisabled();
  });

  it("미리보기는 저장한 가이드를 새 탭에서 보여 주고, 빈 선택 항목은 숨긴다", async () => {
    guide = guideResponse({ referenceUrls: ["https://example.com/a"] });
    mockPreview = {
      campaignName: "반려다움 부드러운 덴탈츄 프리미엄형 인스타그램 캠페인",
      campaignType: "제품발송형",
      progressPeriod: "2026.11.28~2026.12.28",
      campaignCode: "PB-00000000000020",
      brandName: "반려다움",
      brandImageUrl: null,
      guide,
    };
    await renderRoute("/campaign/20/progress/guide/preview");

    expect(
      await screen.findByText(
        "반려다움 부드러운 덴탈츄 프리미엄형 인스타그램 캠페인",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("2026.11.28 - 2026.12.28")).toBeInTheDocument();
    expect(screen.getByText("수분크림")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "https://example.com/a" }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.getByText("반려견이 먹는 모습을 담아 주세요."),
    ).toBeInTheDocument();
    // 유의사항이 비어 있어 행이 없음.
    expect(screen.queryByText("유의사항")).not.toBeInTheDocument();
  });
});
