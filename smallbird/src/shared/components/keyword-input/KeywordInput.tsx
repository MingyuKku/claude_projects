import { X } from "lucide-react";
import { useState } from "react";

import { FormField } from "@/shared/components/form-field";
import { TextCounter } from "@/shared/components/text-field";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";

import { addKeyword, stripKeywordComma } from "./keywords";

import type { KeyboardEvent } from "react";

interface KeywordInputProps {
  label: string;
  value: string[];
  onChangeValue: (keywords: string[]) => void;
  placeholder: string;
  /** 칩 삭제 버튼의 읽기 이름(예: "수분크림 삭제"). */
  removeLabel: (keyword: string) => string;
  /** 있으면 입력칸 오른쪽에 "개수 / 최대"를 보이고, 다 차면 더 추가하지 않음. */
  maxCount?: number;
  isRequired?: boolean;
  disabled?: boolean;
}

// 키워드를 입력하고 Enter로 칩을 더함(Figma Input + Button xs Secondary 칩 줄).
export function KeywordInput({
  label,
  value,
  onChangeValue,
  placeholder,
  removeLabel,
  maxCount,
  isRequired = true,
  disabled,
}: KeywordInputProps) {
  const [input, setInput] = useState("");
  const isFull = maxCount !== undefined && value.length >= maxCount;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 한글 조합 중 Enter는 글자 확정이라 넘김.
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (isFull) return;
    onChangeValue(addKeyword(value, input));
    setInput("");
  }

  return (
    <FormField label={label} isRequired={isRequired} disabled={disabled}>
      {(control) => (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Input
              {...control}
              placeholder={placeholder}
              value={input}
              className={cn(maxCount !== undefined && "pr-14")}
              onChange={(event) =>
                setInput(stripKeywordComma(event.target.value))
              }
              onKeyDown={handleKeyDown}
            />
            {maxCount !== undefined && (
              <TextCounter
                length={value.length}
                maxLength={maxCount}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
              />
            )}
          </div>
          {value.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {value.map((keyword) => (
                <li
                  key={keyword}
                  className="inline-flex h-7 items-center gap-1 rounded-md bg-secondary px-2 ds-text-xs-4-medium text-primary"
                >
                  {keyword}
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={removeLabel(keyword)}
                    className="cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed"
                    onClick={() =>
                      onChangeValue(value.filter((item) => item !== keyword))
                    }
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </FormField>
  );
}
