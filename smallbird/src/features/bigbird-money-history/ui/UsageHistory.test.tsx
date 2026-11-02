import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import { fetchUsageFilterOptions, fetchUsageList } from "../api/usage-api";
import { UsageHistory } from "./UsageHistory";

vi.mock("../api/usage-api", () => ({
  fetchUsageList: vi.fn(),
  fetchUsageFilterOptions: vi.fn(),
}));

function renderMobile(entry = "/") {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter initialEntries={[entry]}>
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

  it("툴바는 켜진 검색창·필터 아이콘·켜진 개수 선택이다", async () => {
    vi.mocked(fetchUsageList).mockResolvedValue({
      records: [],
      totalCount: 0,
      page: 1,
      totalPages: 0,
    });
    renderMobile();

    await screen.findByText("사용 내역이 없습니다.");
    expect(screen.getByRole("searchbox")).toBeEnabled();
    expect(screen.getByRole("button", { name: "필터" })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "한 번에 볼 개수" }),
    ).toBeEnabled();
  });

  describe("검색어", () => {
    const emptyList = { records: [], totalCount: 0, page: 1, totalPages: 0 };

    it("주소의 검색어를 목록 요청에 함께 보내고, 결과가 없으면 검색어 안내를 보인다", async () => {
      vi.mocked(fetchUsageList).mockResolvedValue(emptyList);
      renderMobile("/?keyword=%EA%B3%84%EC%95%BD%EB%B9%84%EC%9A%A9");

      expect(
        await screen.findByText("‘계약비용’에 대한 결과가 없습니다."),
      ).toBeInTheDocument();
      expect(fetchUsageList).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: "계약비용", page: 1 }),
      );
    });

    it("Enter로 검색하면 검색어를 걸어 다시 읽고, 입력은 100자로 제한한다", async () => {
      vi.mocked(fetchUsageList).mockResolvedValue(emptyList);
      renderMobile();
      await screen.findByText("사용 내역이 없습니다.");

      const box = screen.getByRole("searchbox");
      expect(box).toHaveAttribute("maxlength", "100");
      await userEvent.type(box, "PICK형{Enter}");

      await waitFor(() =>
        expect(fetchUsageList).toHaveBeenLastCalledWith(
          expect.objectContaining({ keyword: "PICK형" }),
        ),
      );
    });
  });

  describe("주소에 캠페인 필터가 있을 때", () => {
    const emptyList = { records: [], totalCount: 0, page: 1, totalPages: 0 };

    it("선택지를 읽는 동안은 목록을 읽지 않고, 도착하면 필터를 건 목록을 읽는다", async () => {
      let resolveOptions: (value: {
        campaigns: { campaignIdx: number; campaignName: string }[];
        usageDetails: never[];
      }) => void = () => {};
      vi.mocked(fetchUsageFilterOptions).mockReturnValue(
        new Promise((resolve) => {
          resolveOptions = resolve;
        }),
      );
      vi.mocked(fetchUsageList).mockResolvedValue(emptyList);
      renderMobile("/?campaign=123");

      await waitFor(() => expect(fetchUsageFilterOptions).toHaveBeenCalled());
      expect(fetchUsageList).not.toHaveBeenCalled();

      resolveOptions({
        campaigns: [{ campaignIdx: 123, campaignName: "캠페인" }],
        usageDetails: [],
      });

      await waitFor(() =>
        expect(fetchUsageList).toHaveBeenCalledWith(
          expect.objectContaining({ campaignIdx: 123 }),
        ),
      );
      expect(fetchUsageList).toHaveBeenCalledTimes(1);
    });

    it("선택지 조회가 실패하면 필터 없이 목록을 읽는다", async () => {
      vi.mocked(fetchUsageFilterOptions).mockRejectedValue(new Error("500"));
      vi.mocked(fetchUsageList).mockResolvedValue(emptyList);
      renderMobile("/?campaign=123");

      expect(
        await screen.findByText("사용 내역이 없습니다."),
      ).toBeInTheDocument();
      expect(fetchUsageList).toHaveBeenCalledTimes(1);
      expect(fetchUsageList).not.toHaveBeenCalledWith(
        expect.objectContaining({ campaignIdx: expect.anything() }),
      );
    });

    it("필터가 없는 주소는 선택지를 기다리지 않고 바로 목록을 읽는다", async () => {
      vi.mocked(fetchUsageFilterOptions).mockReturnValue(new Promise(() => {}));
      vi.mocked(fetchUsageList).mockResolvedValue(emptyList);
      renderMobile("/");

      expect(
        await screen.findByText("사용 내역이 없습니다."),
      ).toBeInTheDocument();
    });
  });
});
