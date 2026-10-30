import { X } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { FilterDialogBody } from "./FilterDialog";

import type { FilterField, FilterValues } from "./filter-fields";

interface FilterScreenProps {
  /** X·뒤로 가기. 적용 없이 닫음. */
  onClose: () => void;
  fields: FilterField[];
  /** 지금 적용된 필터. */
  values: FilterValues;
  /** 적용된 값으로 바꾸고 닫음. */
  onApply: (values: FilterValues) => void;
}

// TAB "필터 검색 설정"(구독 결제내역 Figma 10061:202323). MO 모달과 같은 입력·버튼이고, 모달이 아니라 헤더·LNB는 두고 본문을 대체함.
export function FilterScreen({
  onClose,
  fields,
  values,
  onApply,
}: FilterScreenProps) {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby="filter-screen-title"
      // 헤더(64px)와 아래 여백(20px)을 뺀 높이를 채워 하단 버튼이 화면 맨 아래에 붙음(시안).
      className="flex min-h-[calc(100dvh-5.25rem)] flex-1 flex-col"
    >
      {/* 서브헤더는 페이지 여백을 벗어나 본문 폭 전체에 구분선을 그림(시안 60px). */}
      <header className="-mx-(--mypage-gutter) flex h-15 items-center justify-between border-b border-border px-(--mypage-gutter)">
        <h2 id="filter-screen-title" className="text-base font-semibold">
          {t("list.filter.title")}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-foreground"
          aria-label={t("action.close")}
          onClick={onClose}
        >
          <X />
        </Button>
      </header>
      <FilterDialogBody
        variant="screen"
        fields={fields}
        values={values}
        onApply={onApply}
      />
    </section>
  );
}
