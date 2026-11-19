import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { BigbirdInquiryWorkspace } from "./BigbirdInquiryWorkspace";

import type { BigbirdInquiryViewModel } from "@/entities/inquiry";

function renderWorkspace(props: { isPanelOpen: boolean; isError?: boolean }) {
  render(
    <MemoryRouter>
      <BigbirdInquiryWorkspace
        threadUserIdx={undefined}
        inquiries={[]}
        isLoading={false}
        isError={props.isError ?? false}
        onClickRefresh={() => {}}
        isPanelOpen={props.isPanelOpen}
        panelLabel="대화"
      >
        <p>패널 내용</p>
      </BigbirdInquiryWorkspace>
    </MemoryRouter>,
  );
  // 보임 여부는 대화 패널을 감싼 묶음이 정함
  const panel = screen.getByLabelText("대화", { selector: "section" });
  return panel.parentElement ?? panel;
}

describe("BigbirdInquiryWorkspace 빈 목록", () => {
  it("PC에서는 오른쪽 패널을 그리지 않는다", () => {
    expect(renderWorkspace({ isPanelOpen: false })).toHaveClass(
      "desktop:hidden",
    );
  });

  it("특정 문의 URL로 들어온 경우에는 패널을 유지한다", () => {
    expect(renderWorkspace({ isPanelOpen: true })).not.toHaveClass(
      "desktop:hidden",
    );
  });

  it("목록 오류일 때는 패널을 유지한다", () => {
    expect(
      renderWorkspace({ isPanelOpen: false, isError: true }),
    ).not.toHaveClass("desktop:hidden");
  });
});

describe("BigbirdInquiryWorkspace 무한 스크롤", () => {
  const done: BigbirdInquiryViewModel = {
    threadIdx: 1,
    sequence: 1,
    campaignIdx: null,
    isRealtime: false,
    isFinished: true,
    status: "done",
    realtimePhase: null,
    createdAt: new Date("2026-10-29T09:00:00"),
    messages: [],
  };

  function renderList(
    path: string,
    props: { isError?: boolean; hasMore?: boolean },
  ) {
    render(
      <MemoryRouter initialEntries={[path]}>
        <BigbirdInquiryWorkspace
          threadUserIdx={undefined}
          inquiries={[done]}
          isLoading={false}
          isError={props.isError ?? false}
          hasMore={props.hasMore ?? false}
          onLoadMore={() => {}}
          onClickRefresh={() => {}}
          isPanelOpen={false}
          panelLabel="대화"
        >
          <p>패널 내용</p>
        </BigbirdInquiryWorkspace>
      </MemoryRouter>,
    );
  }

  it("탭으로 걸러 비어도 더 받을 쪽이 있으면 빈 상태 대신 이어 받는다", () => {
    renderList("/?status=waiting", { hasMore: true });
    expect(
      screen.queryByText("문의사항이 존재하지 않습니다."),
    ).not.toBeInTheDocument();
  });

  it("상담 중 탭에는 서버가 함께 준 상담 요청 중 문의도 걸러 내지 않고 보인다", () => {
    render(
      <MemoryRouter initialEntries={["/?status=consulting"]}>
        <BigbirdInquiryWorkspace
          threadUserIdx={undefined}
          inquiries={[
            { ...done, threadIdx: 1, status: "requested", isFinished: false },
            { ...done, threadIdx: 2, status: "waiting", isFinished: false },
          ]}
          isLoading={false}
          isError={false}
          onClickRefresh={() => {}}
          isPanelOpen={false}
          panelLabel="대화"
        >
          <p>패널 내용</p>
        </BigbirdInquiryWorkspace>
      </MemoryRouter>,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(within(items[0]!).getByText("상담 요청 중")).toBeInTheDocument();
  });

  it("다음 쪽을 받지 못하면 불러 둔 목록을 남기고 아래에 다시 시도를 보인다", () => {
    renderList("/", { isError: true, hasMore: true });
    expect(
      screen.getByText("문의 목록을 불러오지 못했습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "다시 시도" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });
});

describe("BigbirdInquiryWorkspace 목록 카드", () => {
  const base: BigbirdInquiryViewModel = {
    threadIdx: 1,
    sequence: 1,
    campaignIdx: null,
    isRealtime: false,
    isFinished: false,
    status: "waiting",
    realtimePhase: null,
    createdAt: new Date("2026-10-29T09:00:00"),
    messages: [],
  };

  it("출금 문의 카드는 태그는 기타문의 그대로 두고 제목만 출금 문의로 보인다", () => {
    render(
      <MemoryRouter>
        <BigbirdInquiryWorkspace
          threadUserIdx={undefined}
          inquiries={[{ ...base, isWithdrawalInquiry: true }]}
          isLoading={false}
          isError={false}
          onClickRefresh={() => {}}
          isPanelOpen={false}
          panelLabel="대화"
        >
          <p>패널 내용</p>
        </BigbirdInquiryWorkspace>
      </MemoryRouter>,
    );
    expect(screen.getByText("빅버드 머니 출금 문의")).toBeInTheDocument();
    expect(screen.getByText("기타문의")).toBeInTheDocument();
    expect(screen.queryByText("기타 문의")).not.toBeInTheDocument();
  });

  it.each([
    [{ status: "requested" }, "상담 요청 중"],
    [{ status: "consulting" }, "실시간 상담중"],
    [{ status: "unknown", statusCode: "SOMETHING_NEW" }, "SOMETHING_NEW"],
  ] as const)("%j 상태 카드는 배지 %s를 보인다", (override, label) => {
    render(
      <MemoryRouter>
        <BigbirdInquiryWorkspace
          threadUserIdx={undefined}
          inquiries={[{ ...base, ...override }]}
          isLoading={false}
          isError={false}
          onClickRefresh={() => {}}
          isPanelOpen={false}
          panelLabel="대화"
        >
          <p>패널 내용</p>
        </BigbirdInquiryWorkspace>
      </MemoryRouter>,
    );
    const card = screen.getByText("기타 문의").closest("li");
    expect(within(card!).getByText(label)).toBeInTheDocument();
  });

  it("기타 문의 카드는 기타문의 태그와 2행 제목 기타 문의를, 캠페인 문의 카드는 캠페인 문의 태그를 보인다", () => {
    render(
      <MemoryRouter>
        <BigbirdInquiryWorkspace
          threadUserIdx={undefined}
          inquiries={[
            base,
            {
              ...base,
              threadIdx: 2,
              campaignIdx: 10,
              brandName: "LG전자",
              productName: "디오스 냉장고",
            },
          ]}
          isLoading={false}
          isError={false}
          onClickRefresh={() => {}}
          isPanelOpen={false}
          panelLabel="대화"
        >
          <p>패널 내용</p>
        </BigbirdInquiryWorkspace>
      </MemoryRouter>,
    );

    expect(screen.getAllByText("기타문의")).toHaveLength(1);
    expect(screen.getAllByText("기타 문의")).toHaveLength(1);
    expect(screen.getAllByText("캠페인 문의")).toHaveLength(1);
    expect(screen.getByText("디오스 냉장고 문의")).toBeInTheDocument();
  });

  it("캠페인 목록에 없는 캠페인도 목록 응답의 브랜드명·상품명으로 보인다", () => {
    render(
      <MemoryRouter>
        <BigbirdInquiryWorkspace
          threadUserIdx={undefined}
          inquiries={[
            {
              ...base,
              campaignIdx: 10,
              brandName: "LG전자",
              productName: "디오스 냉장고",
            },
          ]}
          isLoading={false}
          isError={false}
          onClickRefresh={() => {}}
          isPanelOpen={false}
          panelLabel="대화"
        >
          <p>패널 내용</p>
        </BigbirdInquiryWorkspace>
      </MemoryRouter>,
    );

    expect(screen.getByText("LG전자")).toBeInTheDocument();
    expect(screen.getByText("디오스 냉장고 문의")).toBeInTheDocument();
  });
});
