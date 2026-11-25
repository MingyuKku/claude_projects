import type { CreatorViewModel } from "../model/types";

/** 요청이 끝났을 때 그 요청을 시작한 창이 아직 열려 있는지 가릴 때 씀. */
export function isSameTargets(
  a: CreatorViewModel[] | null,
  b: CreatorViewModel[] | null,
) {
  return toTargetsKey(a) === toTargetsKey(b);
}

/** 대상이 바뀌면 창을 새로 그리게 하는 React key. */
export function toTargetsKey(targets: CreatorViewModel[] | null) {
  return targets?.map((item) => item.key).join() ?? "";
}
