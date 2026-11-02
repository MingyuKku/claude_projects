import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import { fetchUsageFilterOptions, fetchUsageList } from "../api/usage-api";
import { UsageHistory } from "./UsageHistory";

vi.mock("../api/usage-api", () => ({
  fetchUsageList: vi.fn(),
  fetchUsageFilterOptions: vi.fn(),
}));

function renderMobile() {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter>
        <UsageHistory
          activeId={null}
          isPanelOpen={false}
          onClickDetail={vi.fn()}
        />
      </MemoryRouter>
    </SWRConfig>,
  );
}

describe("UsageHistory (MO)", () => {
  beforeEach(() =>
    vi
      .mocked(fetchUsageFilterOptions)
      .mockResolvedValue({ campaigns: [], usageDetails: [] }),
  );
  afterEach(() => {
    vi.mocked(fetchUsageList).mockReset();
    vi.mocked(fetchUsageFilterOptions).mockReset();
  });

  it("0건이면 사용 내역 안내 문구를 보이고 쪽 이동은 없다", async () => {
    vi.mocked(fetchUsageList).mockResolvedValue({
      records: [],
      totalCount: 0,
      page: 1,
      totalPages: 0,
    });
    renderMobile();

    expect(
      await screen.findByText("사용 내역이 없습니다."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "페이지 이동" }),
    ).not.toBeInTheDocument();
  });

  it("툴바는 비활성 검색창·필터 아이콘·켜진 개수 선택이다", async () => {
    vi.mocked(fetchUsageList).mockResolvedValue({
      records: [],
      totalCount: 0,
      page: 1,
      totalPages: 0,
    });
    renderMobile();

    await screen.findByText("사용 내역이 없습니다.");
    expect(screen.getByRole("searchbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "필터" })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "한 번에 볼 개수" }),
    ).toBeEnabled();
  });
});
