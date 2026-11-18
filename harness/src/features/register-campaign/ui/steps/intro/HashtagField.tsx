import { X } from "lucide-react";
import { useState } from "react";

import { FormField } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import { Input } from "@/shared/ui/input";

import { addHashtag } from "../../../model/hashtags";

import type { KeyboardEvent } from "react";

interface HashtagFieldProps {
  label: string;
  value: string[];
  onChangeValue: (hashtags: string[]) => void;
  disabled?: boolean;
}

export function HashtagField({
  label,
  value,
  onChangeValue,
  disabled,
}: HashtagFieldProps) {
  const { t } = useTranslation("features/register-campaign");
  const [input, setInput] = useState("");

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 한글 조합 중 Enter는 글자 확정이라 넘김.
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    onChangeValue(addHashtag(value, input));
    setInput("");
  }

  return (
    <FormField label={label} isRequired disabled={disabled}>
      {(control) => (
        <div className="flex flex-col gap-2">
          <Input
            {...control}
            placeholder={t("intro.hashtag.placeholder")}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
          />
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
                    aria-label={t("intro.hashtag.remove", { keyword })}
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
