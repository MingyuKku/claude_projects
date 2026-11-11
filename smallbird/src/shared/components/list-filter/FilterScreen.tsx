import { X } from "lucide-react";

import { SubHeader } from "@/shared/components/app-header";
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
// 제목줄은 디자인 시스템 서브헤더(제목 + 닫기)로 본문 여백 끝까지 채움(디자인 QA 26/11/10 - TAB - 45).
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
      // 헤더와 아래 여백(20px)을 뺀 높이를 채워 하단 버튼이 화면 맨 아래에 붙음(시안).
      className="flex min-h-[calc(100dvh-var(--app-header-height)-var(--spacing)*5)] flex-1 flex-col"
    >
      {/* 구분선이 레이아웃 여백(--mypage-gutter) 끝까지 닿도록 여백만큼 바깥으로 나감. */}
      <SubHeader
        className="-mx-(--mypage-gutter) w-auto"
        title={<h2 id="filter-screen-title">{t("list.filter.title")}</h2>}
        actions={
          <Button
            type="button"
            variant="ghost-foreground"
            size="icon"
            // TAB부터 닫기 버튼 48·아이콘 24(Figma Header / Sub, MO는 40·16). 다른 패널의 닫기 버튼과 같은 값.
            className="tablet:size-12 tablet:[&_svg:not([class*='size-'])]:size-6"
            aria-label={t("action.close")}
            onClick={onClose}
          >
            <X />
          </Button>
        }
      />
      <FilterDialogBody
        variant="screen"
        fields={fields}
        values={values}
        onApply={onApply}
      />
    </section>
  );
}
