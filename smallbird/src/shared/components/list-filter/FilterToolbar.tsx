import { RotateCw, Settings2 } from "lucide-react";

import { Combobox } from "@/shared/components/combobox";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { usePanelParam } from "@/shared/lib/usePanelParam";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { DESKTOP_QUERY, FILTER_PANEL, TABLET_QUERY } from "./constants";
import { hasActiveFilter } from "./filter-values";
import { FilterDialog } from "./FilterDialog";
import { InlineDateField, SelectField } from "./FilterFields";
import { ListSearch } from "./ListSearch";

import type { FilterField, FilterValues } from "./filter-fields";
import type { InlineFrom } from "./use-filter-screen";

interface PageSizeSelect {
  value: number;
  options: readonly number[];
  onChange: (size: number) => void;
  /** 서버가 허용하는 개수가 정해지기 전에는 고정값을 흐리게 보임(빅버드 머니). */
  isDisabled?: boolean;
}

interface FilterToolbarProps {
  fields: FilterField[];
  /** 지금 적용된 필터. */
  values: FilterValues;
  onChangeValues: (values: FilterValues) => void;
  /** MO 모달의 "적용하기". 필터를 쓰고 모달을 닫음. */
  onApplyFromDialog: (values: FilterValues) => void;
  onRefresh: () => void;
  /**
   * 툴바가 인라인으로 바뀌는 폭. 기본 `tablet`(TAB부터 인라인, MO만 "필터" 모달). `desktop`이면 TAB도 "필터" 버튼이고
   * 눌리면 `?panel=filter`가 열리며, TAB은 모달이 아니라 쓰는 쪽이 `useFilterScreen`·`FilterScreen`으로 본문을 대체함.
   */
  inlineFrom?: InlineFrom;
  /**
   * 있으면 줄 오른쪽 끝에 "N개 보기" 선택을 그림(구독 결제 내역 시안). 이때 TAB·MO 배치도 시안(검색·필터 버튼·선택 한 줄)을 따르고
   * MO 필터 버튼은 아이콘만 둠. 없으면 기존 배치.
   */
  pageSize?: PageSizeSelect;
  /** 인라인 Select 폭을 시안의 140px로 좁힘(구독 결제 내역). 기본은 222px. */
  isNarrowSelect?: boolean;
  /**
   * 필드가 많은 툴바(빅버드 머니 사용 내역: 검색 + 필드 4개)용. PC에서 필드를 178px(검색 204px)까지 늘어나게 하되
   * 옆 패널이 열려 좁아지면 한 줄을 유지하도록 줄어듦. 기본은 고정 폭이고 모자라면 줄을 바꿈.
   */
  isCompact?: boolean;
  /** PC에서 필드가 남은 폭을 똑같이 나눠 채움(빅버드 머니 충전/출금 내역에 옆 패널이 열렸을 때, 시안 187px씩). */
  shouldFillFields?: boolean;
  /** 없으면 검색창을 그리지 않음(충전 내역은 검색 없음). */
  search?: {
    keyword: string;
    onSubmit: (keyword: string) => void;
    isDisabled?: boolean;
  };
}

// PC·TAB: 검색(있으면)·필터 필드·새로고침을 인라인으로. 검색은 PC에서는 맨 앞, TAB에서는 필터 줄 아래 둘째 줄.
// MO: 검색(있으면) + "필터" 버튼 → 전체 화면 모달(`?panel=filter`, 뒤로 가기로 닫힘).
export function FilterToolbar({
  fields,
  values,
  onChangeValues,
  onApplyFromDialog,
  onRefresh,
  inlineFrom = "tablet",
  pageSize,
  isNarrowSelect = false,
  isCompact = false,
  shouldFillFields = false,
  search,
}: FilterToolbarProps) {
  const { t } = useTranslation();
  const filterLabel = t("list.filter.action");
  const isTabletUp = useMediaQuery(TABLET_QUERY);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const isInline = inlineFrom === "desktop" ? isDesktop : isTabletUp;
  const { panel, openPanel, closePanel } = usePanelParam({
    panels: [FILTER_PANEL],
  });

  function setValue(updates: FilterValues, removedKeys: string[] = []) {
    const next = { ...values, ...updates };
    for (const key of removedKeys) delete next[key];
    onChangeValues(next);
  }

  const pageSizeNode = pageSize && (
    <PageSizePicker
      pageSize={pageSize}
      isShort={!isTabletUp}
      className={cn(
        "shrink-0",
        isTabletUp ? "w-30" : "w-25",
        pageSize.isDisabled && "opacity-50",
      )}
    />
  );

  if (!isInline) {
    // 검색이 없는 툴바(빅버드 머니 충전/출금 내역)는 MO "필터" 버튼이 글자와 함께 남은 폭을 채움(시안).
    const isIconOnlyFilter = Boolean(pageSize && search && !isTabletUp);
    const searchNode = search && (
      <ListSearch
        key={search.keyword}
        keyword={search.keyword}
        onSubmitKeyword={search.onSubmit}
        isDisabled={search.isDisabled}
        className={cn("min-w-0", pageSize && isTabletUp ? "w-71.75" : "flex-1")}
      />
    );
    return (
      <>
        <div className={cn("flex", pageSize && isTabletUp ? "gap-3" : "gap-2")}>
          {searchNode}
          <Button
            type="button"
            variant={hasActiveFilter(values) ? "outline" : "outline-foreground"}
            size={isIconOnlyFilter ? "icon" : "default"}
            aria-label={isIconOnlyFilter ? filterLabel : undefined}
            className={cn(!isIconOnlyFilter && "min-w-20", !search && "flex-1")}
            onClick={() => openPanel(FILTER_PANEL)}
          >
            <Settings2 />
            {!isIconOnlyFilter && filterLabel}
          </Button>
          {pageSize && <div className="ml-auto">{pageSizeNode}</div>}
        </div>
        <FilterDialog
          // TAB은 모달이 아니라 본문을 대체하는 화면(`FilterScreen`)이라 MO에서만 모달로 엶.
          isOpen={panel === FILTER_PANEL && !isTabletUp}
          onClose={closePanel}
          fields={fields}
          values={values}
          onApply={onApplyFromDialog}
        />
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {search && (
        <ListSearch
          key={search.keyword}
          keyword={search.keyword}
          onSubmitKeyword={search.onSubmit}
          isDisabled={search.isDisabled}
          className={cn(
            "order-last w-full desktop:order-first",
            isCompact
              ? "desktop:w-auto desktop:max-w-51 desktop:min-w-0 desktop:flex-1"
              : "desktop:w-71.75",
          )}
        />
      )}
      {fields.map((field) => (
        <div
          key={field.id}
          className={cn(
            "min-w-0 flex-1",
            isCompact && "desktop:max-w-44.5",
            !isCompact &&
              !shouldFillFields &&
              cn(
                "desktop:flex-none",
                isNarrowSelect && field.type !== "date"
                  ? "desktop:w-35"
                  : "desktop:w-55.5",
              ),
          )}
        >
          {field.type === "date" ? (
            <InlineDateField
              // 적용된 값이 밖에서 바뀌면(새로고침·뒤로 가기) 입력 중이던 값을 버리고 다시 그림.
              key={`${values[`${field.id}From`]}~${values[`${field.id}To`]}`}
              field={field}
              from={values[`${field.id}From`]}
              to={values[`${field.id}To`]}
              onCommit={(from, to) =>
                setValue(
                  from && to
                    ? { [`${field.id}From`]: from, [`${field.id}To`]: to }
                    : {},
                  from && to ? [] : [`${field.id}From`, `${field.id}To`],
                )
              }
            />
          ) : (
            <SelectField
              field={field}
              value={values[field.id]}
              placeholder={field.label}
              onChange={(value) => setValue({ [field.id]: value })}
            />
          )}
        </div>
      ))}
      {/* 시안: 마이페이지 툴바의 새로고침은 모두 Icon Button Ghost Foreground(테두리 없음). */}
      <Button
        type="button"
        variant="ghost-foreground"
        size="icon"
        aria-label={t("list.filter.refresh")}
        onClick={onRefresh}
      >
        <RotateCw />
      </Button>
      {pageSize && <div className="ml-auto">{pageSizeNode}</div>}
    </div>
  );
}

interface PageSizePickerProps {
  pageSize: PageSizeSelect;
  /** MO는 "10개"처럼 짧은 문구(시안). */
  isShort: boolean;
  className?: string;
}

// 시안 Combobox("10개 보기", MO "10개"). 선택지가 몇 개뿐이라 검색 입력은 두지 않음.
function PageSizePicker({ pageSize, isShort, className }: PageSizePickerProps) {
  const { t } = useTranslation();
  const labelKey = isShort ? "list.pageSize.labelShort" : "list.pageSize.label";

  return (
    <Combobox
      className={className}
      aria-label={t("list.pageSize.aria")}
      disabled={pageSize.isDisabled}
      isSearchable={false}
      options={pageSize.options.map((size) => ({
        value: String(size),
        label: t(labelKey, { size }),
      }))}
      value={String(pageSize.value)}
      onValueChange={(value) => pageSize.onChange(Number(value))}
      placeholder={t(labelKey, { size: pageSize.value })}
      searchPlaceholder=""
      emptyText=""
    />
  );
}
