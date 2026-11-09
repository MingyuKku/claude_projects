import type { SelectOption } from "@/shared/components/option-select";

interface FilterFieldBase {
  /** URL 쿼리와 값의 키. 날짜 필드는 `{id}From`·`{id}To` 두 쿼리를 씀. */
  id: string;
  /** PC·TAB 툴바의 자리표시 문구이자 필드 이름. */
  label: string;
  /** MO 필터 모달에서 입력칸 안에 보이는 안내(예: "날짜를 선택하세요."). */
  placeholder: string;
  /**
   * PC 인라인 툴바에서 이 필드의 폭(px, 시안 값). 없으면 `DEFAULT_FIELD_WIDTH`. TAB 필터 화면·MO 모달은 폭 전체를 쓰므로 적용하지 않음.
   * 선택 필드의 팝업 목록은 트리거 폭 이상으로 열림.
   */
  width?: number;
}

export interface DateFilterField extends FilterFieldBase {
  type: "date";
  /** 서버가 기간 검색을 지원하기 전에는 흐리게 둠. */
  isDisabled?: boolean;
}

export interface SelectFilterField extends FilterFieldBase {
  type: "select";
  options: SelectOption[];
  /** 고를 항목이 없거나 선택지 API가 없을 때 흐리게 둠. */
  isDisabled?: boolean;
}

export type FilterField = DateFilterField | SelectFilterField;

/** 필터 값. 키는 `fieldQueryKeys()`가 주는 쿼리 이름이고, 값이 없으면 키가 없음. */
export type FilterValues = Record<string, string>;
