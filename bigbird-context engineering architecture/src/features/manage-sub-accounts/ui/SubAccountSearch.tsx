import { useState } from "react";

import { SearchInput } from "@/shared/components/search-input";
import { useTranslation } from "@/shared/i18n";

import type { FormEvent } from "react";

interface SubAccountSearchProps {
  /** 적용된 검색어. 바뀌면(뒤로 가기 등) 입력칸도 맞추도록 호출하는 쪽이 key로 다시 그림. */
  keyword: string;
  onSubmitKeyword: (keyword: string) => void;
  className?: string;
}

// Figma Table Filter의 Search(Filled, 287w). Enter로 검색하고 1쪽부터 다시 보여 줌(스펙).
export function SubAccountSearch({
  keyword,
  onSubmitKeyword,
  className,
}: SubAccountSearchProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const [draft, setDraft] = useState(keyword);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmitKeyword(draft.trim());
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={className}>
      <SearchInput
        variant="filled"
        // Figma는 테두리까지 포함해 높이 40이라 세로 여백을 1px씩 줄임(공통 Search는 42, 고객센터는 그대로 둠).
        className="py-2.25"
        aria-label={t("list.search.label")}
        placeholder={t("list.search.placeholder")}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    </form>
  );
}
