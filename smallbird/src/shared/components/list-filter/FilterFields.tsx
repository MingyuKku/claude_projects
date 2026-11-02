import { useId, useState } from "react";

import { DateRangePicker } from "@/shared/components/date-picker";
import { OptionSelect } from "@/shared/components/option-select";
import { toDateRange, toIsoDate } from "@/shared/lib/date-range";

import type { DateFilterField, SelectFilterField } from "./filter-fields";
import type { DateRange } from "react-day-picker";

interface DateFieldProps {
  field: DateFilterField;
  from?: string;
  to?: string;
  onChange: (from: string | undefined, to: string | undefined) => void;
  /** 입력칸 안의 문구. PC·TAB은 필드 이름, MO 모달은 안내 문구. */
  placeholder: string;
  /** 필드 이름을 보이는 라벨로 이미 그렸으면 그 id, 아니면 화면에 안 보이는 이름을 만듦. */
  labelledBy?: string;
  className?: string;
}

function toIso(range: DateRange | undefined) {
  return {
    from: range?.from ? toIsoDate(range.from) : undefined,
    to: range?.to ? toIsoDate(range.to) : undefined,
  };
}

export function DateField({
  field,
  from,
  to,
  onChange,
  placeholder,
  labelledBy,
  className,
}: DateFieldProps) {
  const hiddenLabelId = useId();

  return (
    <>
      {!labelledBy && (
        <span id={hiddenLabelId} className="sr-only">
          {field.label}
        </span>
      )}
      <DateRangePicker
        aria-labelledby={labelledBy ?? hiddenLabelId}
        placeholder={placeholder}
        disabled={field.isDisabled}
        value={toDateRange(from, to)}
        onValueChange={(range) => {
          const next = toIso(range);
          onChange(next.from, next.to);
        }}
        className={className}
      />
    </>
  );
}

interface InlineDateFieldProps {
  field: DateFilterField;
  from?: string;
  to?: string;
  onCommit: (from: string | undefined, to: string | undefined) => void;
  className?: string;
}

// PC·TAB 툴바의 날짜. 시작일만 고른 중간 상태는 주소에 쓰지 않으므로 안에서 들고 있다가
// 시작·종료가 모두 정해지거나 지워질 때 적용함. 적용된 값이 밖에서 바뀌면(새로고침·뒤로 가기) 호출하는 쪽이 key로 다시 그림.
export function InlineDateField({
  field,
  from,
  to,
  onCommit,
  className,
}: InlineDateFieldProps) {
  const [draft, setDraft] = useState({ from, to });

  return (
    <DateField
      field={field}
      from={draft.from}
      to={draft.to}
      placeholder={field.label}
      className={className}
      onChange={(nextFrom, nextTo) => {
        setDraft({ from: nextFrom, to: nextTo });
        if ((nextFrom && nextTo) || (!nextFrom && !nextTo)) {
          onCommit(nextFrom, nextTo);
        }
      }}
    />
  );
}

interface SelectFieldProps {
  field: SelectFilterField;
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  labelledBy?: string;
}

export function SelectField({
  field,
  value,
  onChange,
  placeholder,
  labelledBy,
}: SelectFieldProps) {
  const hiddenLabelId = useId();

  // 공통 Select 트리거는 비활성 모양이 없어 감싸서 흐리게 함.
  return (
    <div className={field.isDisabled ? "opacity-50" : undefined}>
      {!labelledBy && (
        <span id={hiddenLabelId} className="sr-only">
          {field.label}
        </span>
      )}
      <OptionSelect
        aria-labelledby={labelledBy ?? hiddenLabelId}
        value={value ?? ""}
        options={field.options}
        placeholder={placeholder}
        disabled={field.isDisabled}
        onChangeValue={onChange}
      />
    </div>
  );
}
