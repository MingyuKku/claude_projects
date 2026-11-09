import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { ApprovalBanner } from "./ApprovalBanner";
import { TestReviewButtons } from "./TestReviewButtons";

import type { ApprovalStatus } from "@/entities/campaign";

const review = vi.hoisted(() => vi.fn());
vi.mock("@/entities/campaign", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  testReviewCampaign: review,
}));

beforeEach(() => review.mockReset().mockResolvedValue(undefined));

describe("ApprovalBanner", () => {
  it.each<[ApprovalStatus, string, string]>([
    [
      "REVIEWING",
      "현재 캠페인은 승인 검토중입니다.",
      "운영팀에서 캠페인 내용을 검토 중입니다.",
    ],
    ["REJECTED", "수정이 필요한 항목이 있습니다.", "반려 사유를 확인하고"],
    [
      "RE_REVIEWING",
      "현재 캠페인은 재승인 검토중입니다.",
      "(최대 2회까지 가능)",
    ],
    [
      "APPROVED",
      "승인이 완료된 캠페인입니다.",
      "확정된 캠페인 정보를 확인할 수 있습니다.",
    ],
  ])("%s 상태의 제목과 본문을 보인다", (status, title, description) => {
    render(<ApprovalBanner campaign={{ status }} />);

    expect(screen.getByRole("heading", { name: title })).toBeVisible();
    expect(
      screen.getByText(new RegExp(description.replace(/[()]/g, "\\$&"))),
    ).toBeVisible();
  });

  it("등록 중 상태는 그리지 않는다", () => {
    const { container } = render(
      <ApprovalBanner campaign={{ status: "DRAFT" }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("오른쪽 버튼 자리는 넘긴 요소를 그대로 보인다", () => {
    render(
      <ApprovalBanner
        campaign={{ status: "REVIEWING" }}
        action={<button>승인 요청 취소</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "승인 요청 취소" }),
    ).toBeVisible();
  });
});

describe("TestReviewButtons", () => {
  function renderButtons(status: ApprovalStatus) {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <TestReviewButtons campaign={{ campaignIdx: 7, status }} />
      </SWRConfig>,
    );
    return userEvent.setup();
  }

  it("검토중이면 승인 완료·반려 전환을 부르고 반려에는 예시 사유를 보낸다", async () => {
    const user = renderButtons("REVIEWING");

    await user.click(screen.getByRole("button", { name: "승인 완료로 전환" }));
    expect(review).toHaveBeenLastCalledWith(7, {
      result: "APPROVE",
      rejections: null,
    });

    await user.click(screen.getByRole("button", { name: "반려로 전환" }));
    expect(review).toHaveBeenLastCalledWith(7, {
      result: "REJECT",
      rejections: [
        expect.objectContaining({ section: "PRODUCT" }),
        expect.objectContaining({ section: "INTRO" }),
      ],
    });
  });

  it("검토중이 아니면 아무것도 그리지 않는다", () => {
    renderButtons("APPROVED");

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
