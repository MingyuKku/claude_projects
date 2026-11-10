import { useState } from "react";

import type { ChangeEvent, ChangeEventHandler, CompositionEvent } from "react";

interface UseTextLengthOptions {
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  /** 주면 이 길이를 넘는 입력은 잘라 냄(브라우저의 `maxLength`가 건너뛰는 입력까지 막음). */
  maxLength?: number;
}

/** UTF-16 길이(브라우저 `maxLength`와 같은 기준)로 자름. 이모지 같은 짝 글자의 앞 절반만 남기지 않음. */
export function clampToMaxLength(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const isHighSurrogate = (code: number) => code >= 0xd800 && code <= 0xdbff;
  const end = isHighSurrogate(value.charCodeAt(maxLength - 1))
    ? maxLength - 1
    : maxLength;
  return value.slice(0, end);
}

// 글자 수 카운터용. 제어·비제어 textarea 모두에서 현재 길이를 구함.
export function useTextLength({
  value,
  defaultValue,
  onChange,
  maxLength,
}: UseTextLengthOptions) {
  const [uncontrolledLength, setUncontrolledLength] = useState(
    String(defaultValue ?? "").length,
  );
  const length =
    value === undefined ? uncontrolledLength : String(value).length;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { target } = event;
    // 한글 조합 중에 값을 바꾸면 조합이 끊기므로 조합이 끝날 때(handleCompositionEnd) 자름.
    const isComposing = (event.nativeEvent as InputEvent).isComposing;
    if (maxLength !== undefined && !isComposing) {
      target.value = clampToMaxLength(target.value, maxLength);
    }
    setUncontrolledLength(target.value.length);
    onChange?.(event);
  };

  const handleCompositionEnd = (
    event: CompositionEvent<HTMLTextAreaElement>,
  ) => {
    const textarea = event.currentTarget;
    if (maxLength === undefined || textarea.value.length <= maxLength) return;
    // React가 바뀐 값을 알아채도록 값 추적을 거치지 않는 원래 setter로 넣고 input 이벤트를 다시 보냄.
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(textarea, clampToMaxLength(textarea.value, maxLength));
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  };

  return { length, handleChange, handleCompositionEnd };
}
