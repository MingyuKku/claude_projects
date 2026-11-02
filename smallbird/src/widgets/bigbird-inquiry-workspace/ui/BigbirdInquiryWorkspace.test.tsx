import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { BigbirdInquiryWorkspace } from "./BigbirdInquiryWorkspace";

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
