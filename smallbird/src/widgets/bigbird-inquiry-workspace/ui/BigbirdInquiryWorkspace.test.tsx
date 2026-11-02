import { render, screen } from "@testing-library/react";
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

  it("기타 문의 카드에만 기타문의 태그를 붙인다", () => {
    render(
      <MemoryRouter>
        <BigbirdInquiryWorkspace
          threadUserIdx={undefined}
          inquiries={[base, { ...base, threadIdx: 2, campaignIdx: 10 }]}
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
    expect(screen.getByText("캠페인 문의")).toBeInTheDocument();
  });
});
