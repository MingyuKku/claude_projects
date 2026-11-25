import { useState } from "react";

import type { CreatorViewModel } from "../model/types";

const EMPTY_KEYS: ReadonlySet<string> = new Set();

/**
 * 목록 행 선택. 선택은 만든 `scope`(폴더·검색어)에서만 유효해서 scope가 바뀌면(뒤로 가기 포함) 비어 보임.
 * 목록에서 사라진 행(해제·다시 읽기)은 선택으로 치지 않음.
 */
export function useRowSelection(items: CreatorViewModel[], scope: string) {
  const [selection, setSelection] = useState({ scope, keys: EMPTY_KEYS });
  const selectedKeys = selection.scope === scope ? selection.keys : EMPTY_KEYS;
  const selectedItems = items.filter((item) => selectedKeys.has(item.key));

  function replaceKeys(keys: Iterable<string>) {
    setSelection({ scope, keys: new Set(keys) });
  }

  return {
    selectedKeys,
    selectedItems,
    select: (key: string, isSelected: boolean) =>
      replaceKeys(
        isSelected
          ? [...selectedKeys, key]
          : [...selectedKeys].filter((selectedKey) => selectedKey !== key),
      ),
    selectAll: (isSelected: boolean) =>
      replaceKeys(isSelected ? items.map((item) => item.key) : []),
    // 요청이 끝난 뒤 불려도 그사이 바뀐 선택을 되돌리지 않게 최신 값에서 뺌.
    deselect: (keys: string[]) =>
      setSelection((current) => ({
        ...current,
        keys: new Set([...current.keys].filter((key) => !keys.includes(key))),
      })),
  };
}
