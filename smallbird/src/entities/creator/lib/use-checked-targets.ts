import { useState } from "react";

import type { CreatorViewModel } from "../model/types";

/** 창을 연 크리에이터 중 체크한 사람. 처음엔 모두 체크됨. */
export function useCheckedTargets(targets: CreatorViewModel[]) {
  const [checkedKeys, setCheckedKeys] = useState<ReadonlySet<string>>(
    () => new Set(targets.map((item) => item.key)),
  );

  return {
    checkedKeys,
    checkedTargets: targets.filter((item) => checkedKeys.has(item.key)),
    changeChecked: (key: string, isChecked: boolean) => {
      const next = new Set(checkedKeys);
      if (isChecked) next.add(key);
      else next.delete(key);
      setCheckedKeys(next);
    },
  };
}
