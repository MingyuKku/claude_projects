import { RotateCcw } from "lucide-react";
import { useId, useState } from "react";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import { isSameFilterValues } from "./filter-values";
import { DateField, SelectField } from "./FilterFields";

import type { FilterField, FilterValues } from "./filter-fields";

interface FilterDialogProps {
  isOpen: boolean;
  /** X·뒤로 가기·바깥 눌림. 적용 없이 닫음. */
  onClose: () => void;
  fields: FilterField[];
  /** 지금 적용된 필터. */
  values: FilterValues;
  /** 적용된 값으로 바꾸고 닫음. */
  onApply: (values: FilterValues) => void;
}

/** 시작일만 고른 날짜는 적용하지 않으므로 시작·종료가 모두 있는 날짜만 남김. */
function normalize(draft: FilterValues, fields: FilterField[]) {
  const next: FilterValues = { ...draft };
  for (const field of fields) {
    if (field.type !== "date") continue;
    const fromKey = `${field.id}From`;
    const toKey = `${field.id}To`;
    if (!next[fromKey] || !next[toKey]) {
      delete next[fromKey];
      delete next[toKey];
    }
  }
  return next;
}

// MO "필터 검색 설정"(Figma 7053:282708·7053:283474). 입력은 모달 안에서 들고 있다가 "적용하기"에서 목록에 반영함.
// 닫히면 내용을 지워 다시 열 때 적용된 값부터 시작함.
export function FilterDialog({
  isOpen,
  onClose,
  fields,
  values,
  onApply,
}: FilterDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        // MO 헤더를 두고 그 아래만 덮음.
        // 오버레이는 헤더 자리만 보이므로, 헤더가 어둡게 가려지지 않게 딤을 없앰.
        overlayClassName="bg-transparent"
        className="top-(--app-header-height) left-0 flex h-[calc(100dvh-var(--app-header-height))] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-border px-4 py-4 text-left">
          <DialogTitle className="text-base">
            {t("list.filter.title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("list.filter.description")}
          </DialogDescription>
        </DialogHeader>
        <FilterDialogBody fields={fields} values={values} onApply={onApply} />
      </DialogContent>
    </Dialog>
  );
}

interface FilterDialogBodyProps {
  fields: FilterField[];
  values: FilterValues;
  onApply: (values: FilterValues) => void;
  /** `modal`은 MO 모달(자체 좌우 여백 16), `screen`은 TAB 본문 대체 화면(페이지 여백을 따름). */
  variant?: "modal" | "screen";
}

export function FilterDialogBody({
  fields,
  values,
  onApply,
  variant = "modal",
}: FilterDialogBodyProps) {
  const { t } = useTranslation();
  const idPrefix = useId();
  const [draft, setDraft] = useState<FilterValues>(values);
  const isScreen = variant === "screen";
  const next = normalize(draft, fields);
  const hasChanges = !isSameFilterValues(next, values);

  function setValue(key: string, value: string | undefined) {
    setDraft((current) => {
      const updated = { ...current };
      if (value) updated[key] = value;
      else delete updated[key];
      return updated;
    });
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-1 flex-col",
          // TAB 화면은 <main>이 스크롤하므로 overflow를 두지 않음. overflow-y-auto는 가로도 auto로 바꿔
          // 좌우 여백이 없는 이 화면에서 셀렉트·날짜 입력의 포커스 링을 잘라 냄.
          // MO 모달 시안(빅버드 머니 `11224:105649`): 본문 16/16/12/16, 하단 16 여백에 구분선 없음.
          isScreen ? "gap-3 py-5" : "gap-4 overflow-y-auto px-4 pt-4 pb-3",
        )}
      >
        {fields.map((field) => {
          const labelId = `${idPrefix}-${field.id}`;
          return (
            <div
              key={field.id}
              className="flex flex-col gap-2 text-sm font-medium"
            >
              <span id={labelId}>{field.label}</span>
              {field.type === "date" ? (
                <DateField
                  field={field}
                  from={draft[`${field.id}From`]}
                  to={draft[`${field.id}To`]}
                  placeholder={field.placeholder}
                  labelledBy={labelId}
                  onChange={(from, to) => {
                    setValue(`${field.id}From`, from);
                    setValue(`${field.id}To`, to);
                  }}
                />
              ) : (
                <SelectField
                  field={field}
                  value={draft[field.id]}
                  placeholder={field.placeholder}
                  labelledBy={labelId}
                  onChange={(value) => setValue(field.id, value)}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className={cn("flex gap-2", isScreen ? "pt-5" : "p-4")}>
        <Button
          type="button"
          variant="outline"
          className={cn(isScreen && "h-9.5")}
          onClick={() => setDraft({})}
        >
          <RotateCcw />
          {t("list.filter.reset")}
        </Button>
        <Button
          type="button"
          className={cn("flex-1", isScreen && "h-9.5")}
          disabled={!hasChanges}
          onClick={() => onApply(next)}
        >
          {t("list.filter.apply")}
        </Button>
      </div>
    </>
  );
}
