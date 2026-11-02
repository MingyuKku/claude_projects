import { useState } from "react";

import type { ChangeEvent, ChangeEventHandler } from "react";

interface UseTextLengthOptions {
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
}

// 글자 수 카운터용. 제어·비제어 textarea 모두에서 현재 길이를 구함.
export function useTextLength({
  value,
  defaultValue,
  onChange,
}: UseTextLengthOptions) {
  const [uncontrolledLength, setUncontrolledLength] = useState(
    String(defaultValue ?? "").length,
  );
  const length =
    value === undefined ? uncontrolledLength : String(value).length;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setUncontrolledLength(event.target.value.length);
    onChange?.(event);
  };

  return { length, handleChange };
}
