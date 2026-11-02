import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import { fetchChargeList } from "../api/charge-api";
import { ChargeHistory } from "./ChargeHistory";

import type { ChargeListViewModel } from "../model/charge-types";

vi.mock("../api/charge-api", () => ({ fetchChargeList: vi.fn() }));

// 화면 아래 표식이 보이는 것을 흉내 냄. 관찰자는 쪽마다 새로 만들어지므로 가장 최근 것만 깨움.
const observers: Array<{
  callback: IntersectionObserverCallback;
  isLive: boolean;
}> = [];
class FakeIntersectionObserver {
  private readonly entry: {
    callback: IntersectionObserverCallback;
    isLive: boolean;
  };
  constructor(callback: IntersectionObserverCallback) {
    this.entry = { callback, isLive: true };
    observers.push(this.entry);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    this.entry.isLive = false;
  }
}

async function reachBottom() {
  const live = observers.filter((observer) => observer.isLive).at(-1);
  if (!live) throw new Error("살아 있는 표식이 없다");
  await act(async () => {
    live.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    await Promise.resolve();
  });
}

function pageOf(page: number, count: number, totalCount: number) {
  return {
    records: Array.from({ length: count }, (_, index) => ({
      id: `charge-${(page - 1) * 10 + index}`,
      serverId: String((page - 1) * 10 + index),
      type: "charge" as const,
      typeText: "CHARGE",
      requestedAt: null,
      requestedAtText: `2026-10-${String(index + 1).padStart(2, "0")}`,
      amount: 1000 * (index + 1),
      payMethod: "VBANK",
      status: "paid" as const,
      statusText: "DEPOSIT_COMPLETED",
      bankName: "신한은행",
      accountNumber: "1234567890123456",
      holderName: "밍구스",
      completedAt: null,
      completedAtText: "-",
      receiptUrl: null,
    })),
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / 10),
  } satisfies ChargeListViewModel;
}

function renderMobile() {
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MemoryRouter>
        <ChargeHistory
          activeId={null}
          isPanelOpen={false}
          onClickDetail={vi.fn()}
        />
      </MemoryRouter>
    </SWRConfig>,
  );
}

describe("ChargeHistory (MO)", () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(fetchChargeList).mockReset();
  });

  it("쪽 이동 없이 스크롤 끝에 닿으면 다음 쪽을 이어 붙이고 마지막 쪽 뒤에는 더 읽지 않는다", async () => {
    vi.mocked(fetchChargeList).mockImplementation(({ page }) =>
      Promise.resolve(page === 1 ? pageOf(1, 10, 15) : pageOf(2, 5, 15)),
    );
    renderMobile();

    const list = await screen.findByRole("list", {
      name: "충전/출금 상세 내역",
    });
    expect(within(list).getAllByRole("listitem")).toHaveLength(10);
    expect(
      screen.queryByRole("navigation", { name: "페이지 이동" }),
    ).not.toBeInTheDocument();

    await reachBottom();
    await vi.waitFor(() =>
      expect(within(list).getAllByRole("listitem")).toHaveLength(15),
    );
    expect(fetchChargeList).toHaveBeenLastCalledWith({
      entrySize: 10,
      page: 2,
    });

    // 마지막 쪽까지 읽었으니 표식이 사라져 더 부르지 않는다.
    expect(observers.filter((observer) => observer.isLive)).toHaveLength(0);
    expect(fetchChargeList).toHaveBeenCalledTimes(2);
  });

  it("툴바는 전체 폭 필터 버튼과 개수 선택이다", async () => {
    vi.mocked(fetchChargeList).mockResolvedValue(pageOf(1, 1, 1));
    renderMobile();

    await screen.findByRole("list", { name: "충전/출금 상세 내역" });
    expect(screen.getByRole("button", { name: "필터" })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "한 번에 볼 개수" }),
    ).toBeEnabled();
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
  });

  it("0건이면 충전/출금 안내 문구를 보이고 쪽 이동은 없다", async () => {
    vi.mocked(fetchChargeList).mockResolvedValue(pageOf(1, 0, 0));
    renderMobile();

    expect(
      await screen.findByText("충전/출금 내역이 없습니다."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "페이지 이동" }),
    ).not.toBeInTheDocument();
  });
});
