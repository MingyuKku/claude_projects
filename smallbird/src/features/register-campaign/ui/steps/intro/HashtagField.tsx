import { X } from "lucide-react";
import { useState } from "react";

import { FormField } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface HashtagFieldProps {
  value: string[];
  onChangeValue: (hashtags: string[]) => void;
  disabled?: boolean;
}

// 필수 해시태그(키워드): Enter로 칩을 더하고 칩의 "×"로 지움. 같은 값은 넣지 않음.
// 한글 조합 중 Enter(isComposing)는 칩으로 만들지 않음.
export function HashtagField({
  value,
  onChangeValue,
  disabled,
}: HashtagFieldProps) {
  const { t } = useTranslation("features/register-campaign");
  const [input, setInput] = useState("");

  function addHashtag() {
    const tag = input.trim().replace(/^#/, "");
    setInput("");
    if (tag === "" || value.includes(tag)) return;
    onChangeValue([...value, tag]);
  }

  return (
    <FormField label={t("intro.hashtags.label")} isRequired disabled={disabled}>
      {(control) => (
        <>
          <Input
            {...control}
            value={input}
            placeholder={t("intro.hashtags.placeholder")}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.nativeEvent.isComposing)
                return;
              event.preventDefault();
              addHashtag();
            }}
          />
          {value.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {value.map((tag) => (
                <li key={tag}>
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    className="min-w-0"
                    disabled={disabled}
                    aria-label={t("intro.hashtags.remove", { tag })}
                    onClick={() =>
                      onChangeValue(value.filter((v) => v !== tag))
                    }
                  >
                    {tag}
                    <X aria-hidden className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </FormField>
  );
}
