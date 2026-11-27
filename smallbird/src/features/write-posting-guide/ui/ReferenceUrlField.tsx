import { Plus, Trash } from "lucide-react";
import { useId, useState } from "react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import type { KeyboardEvent } from "react";

interface ReferenceUrlFieldProps {
  value: string[];
  onChangeValue: (urls: string[]) => void;
  disabled?: boolean;
}

// 참고 URL(시안 14165:273265): 맨 위 입력칸 + "추가", 아래로 추가한 주소마다 "삭제". MO는 버튼이 입력칸 아래 한 줄.
export function ReferenceUrlField({
  value,
  onChangeValue,
  disabled,
}: ReferenceUrlFieldProps) {
  const { t } = useTranslation("features/write-posting-guide");
  const id = useId();
  const [input, setInput] = useState("");
  const url = input.trim();

  function add() {
    if (!url || value.includes(url)) return;
    onChangeValue([...value, url]);
    setInput("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    add();
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{t("basic.referenceUrl")}</Label>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 tablet:flex-row">
          <Input
            id={id}
            type="url"
            placeholder={t("basic.referenceUrlPlaceholder")}
            value={input}
            disabled={disabled}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            variant="outline"
            className="tablet:w-20 tablet:shrink-0"
            disabled={disabled || !url}
            onClick={add}
          >
            <Plus aria-hidden />
            {t("basic.addUrl")}
          </Button>
        </div>
        {value.map((item) => (
          <div key={item} className="flex flex-col gap-2 tablet:flex-row">
            <Input
              readOnly
              value={item}
              aria-label={t("basic.referenceUrl")}
              disabled={disabled}
            />
            <Button
              variant="outline-foreground"
              className="tablet:w-20 tablet:shrink-0"
              disabled={disabled}
              onClick={() =>
                onChangeValue(value.filter((saved) => saved !== item))
              }
            >
              <Trash aria-hidden />
              {t("basic.removeUrl")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
