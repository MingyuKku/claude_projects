import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { BigbirdInquiryDetailPanel } from "./BigbirdInquiryDetailPanel";

import type { BigbirdInquiryViewModel } from "@/entities/inquiry";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, serverApiV3: { get: vi.fn() } };
});

const inquiry: BigbirdInquiryViewModel = {
  threadIdx: 101,
  sequence: 7,
  campaignIdx: 10,
  isRealtime: false,
  isFinished: false,
  status: "waiting",
  realtimePhase: null,
  createdAt: new Date("2026-10-01T10:00:00"),
  messages: [],
};

function mountPanel(onClickClose = vi.fn()) {
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <BigbirdInquiryDetailPanel
        inquiry={inquiry}
        threadUserIdx={5971}
        onClickClose={onClickClose}
      />
    </SWRConfig>,
  );
  return onClickClose;
}

const CAMPAIGN_LIST = {
  result: true,
  list: [
    {
      campaignIdx: 10,
      campaignCode: "Q-123412341234",
      brandName: "빅버드",
      productName: "스킨케어 캠페인",
      mainImageUrl: null,
      progressStartDate: "2026-10-01",
      progressEndDate: "2026-10-31",
      campaignServiceName: "PICK형",
    },
  ],
};

function renderPanel(
  onClickClose = vi.fn(),
  detail: Record<string, unknown> | Error = {
    result: true,
    mainImageUrl: null,
    campaignType: "PICK형",
    progressStatus: "진행 중",
    progressStartDate: "2026-10-01",
    progressEndDate: "2026-10-31",
    shopCode: "LM-55710521825519",
  },
) {
  vi.mocked(serverApiV3.get).mockImplementation(async (path: string) => {
    if (path !== "/help/thread/campaign/10") return CAMPAIGN_LIST;
    if (detail instanceof Error) throw detail;
    return detail;
  });
  return mountPanel(onClickClose);
}

describe("BigbirdInquiryDetailPanel", () => {
  it("문의한 캠페인의 정보를 보여 준다", async () => {
    renderPanel();

    expect(await screen.findByText("빅버드 스킨케어 캠페인")).toBeVisible();
    expect(screen.getByText("PICK형")).toBeVisible();
    // 상품명 줄은 없고 캠페인 유형·진행 상태·진행 기간만 보임(시안).
    expect(screen.queryByText("상품명")).not.toBeInTheDocument();
    expect(screen.getByText("2026.10.01~2026.10.31")).toBeVisible();
    expect(screen.getByText("Q-123412341234")).toBeVisible();
    expect(await screen.findByText("진행 중")).toBeVisible();
    expect(screen.getByText("LM-55710521825519")).toBeVisible();
    // 이동할 v3 화면이 없어 비활성(P9)
    expect(
      screen.getByRole("button", { name: "캠페인 바로가기" }),
    ).toBeDisabled();
  });

  it("공구샵이 없으면 공구샵 코드를 -로 보이고 복사하지 않는다", async () => {
    renderPanel(vi.fn(), {
      result: true,
      mainImageUrl: null,
      campaignType: "PICK형",
      progressStatus: "진행 중",
      progressStartDate: "2026-10-01",
      progressEndDate: "2026-10-31",
      shopCode: null,
    });

    const shopCode = await screen.findByRole("button", { name: /공구샵 코드/ });
    expect(shopCode).toHaveTextContent("-");
    expect(shopCode).toBeDisabled();
  });

  it("캠페인 정보 API가 실패하면 목록 값으로 보이고 진행 상태·공구샵 코드는 그리지 않는다", async () => {
    renderPanel(vi.fn(), new Error("404"));

    expect(await screen.findByText("빅버드 스킨케어 캠페인")).toBeVisible();
    expect(screen.getByText("2026.10.01~2026.10.31")).toBeVisible();
    expect(screen.queryByText("진행 상태")).not.toBeInTheDocument();
    expect(screen.queryByText("공구샵 코드")).not.toBeInTheDocument();
  });

  it("닫기 버튼을 누르면 닫기 요청을 보낸다", async () => {
    const onClickClose = renderPanel();

    await userEvent.click(
      screen.getByRole("button", { name: "상세 정보 닫기" }),
    );

    expect(onClickClose).toHaveBeenCalledOnce();
  });

  it("캠페인 목록을 받는 동안 불러오는 중으로 표시한다", () => {
    vi.mocked(serverApiV3.get).mockReturnValue(new Promise(() => {}));
    mountPanel();

    expect(screen.getByRole("status", { name: "불러오는 중…" })).toBeVisible();
  });

  it("캠페인 목록을 받지 못하면 오류를 알린다", async () => {
    vi.mocked(serverApiV3.get).mockRejectedValue(new Error("500"));
    mountPanel();

    expect(await screen.findByText("문제가 발생했습니다")).toBeVisible();
  });
});
