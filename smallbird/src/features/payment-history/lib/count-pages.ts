export function countPages(totalCount: number, pageSize: number) {
  return Math.ceil(totalCount / pageSize);
}
