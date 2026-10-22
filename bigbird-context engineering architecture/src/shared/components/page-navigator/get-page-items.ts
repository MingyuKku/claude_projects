export type PageItem =
  { type: "page"; page: number } | { type: "ellipsis"; key: string };

/** Figma Pagination: 번호는 6개까지 보이고 더 있으면 줄임표가 붙음. 현재 쪽이 창 안에 들어오게 창을 밀어 줌. */
export const VISIBLE_PAGE_COUNT = 6;

export function getPageItems(currentPage: number, totalPages: number) {
  const items: PageItem[] = [];
  if (totalPages < 1) return items;

  const lastStart = Math.max(1, totalPages - VISIBLE_PAGE_COUNT + 1);
  const start = Math.min(
    Math.max(1, currentPage - Math.floor(VISIBLE_PAGE_COUNT / 2) + 1),
    lastStart,
  );
  const end = Math.min(totalPages, start + VISIBLE_PAGE_COUNT - 1);

  if (start > 1) items.push({ type: "ellipsis", key: "start" });
  for (let page = start; page <= end; page++)
    items.push({ type: "page", page });
  if (end < totalPages) items.push({ type: "ellipsis", key: "end" });
  return items;
}
