import { act, renderHook } from "@testing-library/react";
import { SWRConfig } from "swr";

import { useCreatorOverlays } from "./use-creator-overlays";

import type { CreatorViewModel } from "@/entities/creator";
import type { ReactNode } from "react";

function creator(key: string, isBookmarked: boolean): CreatorViewModel {
  return {
    key,
    platformIdx: 1,
    platformId: key,
    categoryIdx: 1,
    nickname: key,
    profileImageUrl: null,
    followerCount: 0,
    brandIndex: null,
    groupBuyIndex: null,
    avgCommentWriterCount: null,
    expectedCost: null,
    isBookmarked,
    platformUrl: null,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
  );
}

function setup(folderIdx: number | null) {
  const onReloadList = vi.fn();
  const onDeselect = vi.fn();
  const { result } = renderHook(
    () => useCreatorOverlays({ folderIdx, onReloadList, onDeselect }),
    { wrapper },
  );
  return { result, onReloadList, onDeselect };
}

const SAVED = creator("saved", true);
const OTHER = creator("other", false);

describe("useCreatorOverlays", () => {
  it("목록의 해제는 보고 있는 폴더에서만, 상세·제안의 해제는 모든 폴더에서 뺀다", () => {
    const { result } = setup(7);

    act(() => result.current.openRemove([SAVED]));
    expect(result.current.removeFolderIdx).toBe(7);

    act(() => result.current.toggleBookmark(SAVED));
    expect(result.current.removeFolderIdx).toBeNull();
    expect(result.current.removeTargets).toEqual([SAVED]);
  });

  it("저장하지 않은 크리에이터의 즐겨찾기는 저장 창을 연다", () => {
    const { result } = setup(null);

    act(() => result.current.toggleBookmark(OTHER));

    expect(result.current.saveTargets).toEqual([OTHER]);
    expect(result.current.removeTargets).toBeNull();
  });

  it("저장·해제하면 열려 있는 제안 창의 표시를 맞추고 목록을 다시 읽는다", () => {
    const { result, onReloadList, onDeselect } = setup(null);
    act(() => result.current.openPropose?.([OTHER]));

    act(() => result.current.openSave([OTHER]));
    act(() => result.current.handleSaved());
    expect(result.current.proposeTargets?.[0]?.isBookmarked).toBe(true);
    expect(result.current.saveTargets).toBeNull();

    act(() => result.current.toggleBookmark(creator("other", true)));
    act(() => result.current.handleRemoved());
    expect(result.current.proposeTargets?.[0]?.isBookmarked).toBe(false);
    expect(onDeselect).toHaveBeenCalledWith(["other"]);
    expect(onReloadList).toHaveBeenCalledTimes(2);
  });

  it("한 폴더에서만 해제하면 다른 폴더에 남아 있을 수 있어 제안 창의 표시를 지킨다", () => {
    const { result } = setup(7);
    act(() => result.current.openPropose?.([SAVED]));

    act(() => result.current.openRemove([SAVED]));
    act(() => result.current.handleRemoved());

    expect(result.current.proposeTargets?.[0]?.isBookmarked).toBe(true);
  });

  it("늦게 끝난 요청은 그사이 새로 연 창을 닫지 않는다", () => {
    const { result } = setup(null);
    act(() => result.current.openPropose?.([SAVED]));
    const lateProposed = result.current.handleProposed;
    act(() => result.current.openPropose?.([OTHER]));
    act(() => lateProposed());
    expect(result.current.proposeTargets).toEqual([OTHER]);

    act(() => result.current.openSave([SAVED]));
    const lateSaved = result.current.handleSaved;
    act(() => result.current.openSave([OTHER]));
    act(() => lateSaved());
    expect(result.current.saveTargets).toEqual([OTHER]);
  });
});
