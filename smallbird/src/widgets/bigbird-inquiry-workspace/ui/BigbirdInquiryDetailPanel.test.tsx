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

function renderPanel(onClickClose = vi.fn()) {
  vi.mocked(serverApiV3.get).mockResolvedValue({
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
  });
  return mountPanel(onClickClose);
}

describe("BigbirdInquiryDetailPanel", () => {
  it("문의한 캠페인의 정보를 보여 준다", async () => {
    renderPanel();

    expect(await screen.findByText("빅버드 스킨케어 캠페인")).toBeVisible();
    expect(screen.getByText("PICK형")).toBeVisible();
    expect(screen.getByText("상품명")).toBeVisible();
    expect(screen.getByText("스킨케어 캠페인")).toBeVisible();
    expect(screen.getByText("2026.10.01~2026.10.31")).toBeVisible();
    expect(screen.getByText("Q-123412341234")).toBeVisible();
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
