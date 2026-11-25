import { useState } from "react";

import { SearchInput } from "@/shared/components/search-input";
import { useTranslation } from "@/shared/i18n";

import type { FormEvent } from "react";

interface CreatorKeywordSearchProps {
  /** 적용된 검색어. */
  keyword: string;
  onSubmitKeyword: (keyword: string) => void;
  className?: string;
}

// Enter로 검색함.
export function CreatorKeywordSearch({
  keyword,
  onSubmitKeyword,
  className,
}: CreatorKeywordSearchProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);

  // 뒤로 가기 등으로 적용된 검색어가 바뀌면 입력칸을 맞춤. 다시 그리지 않아 초점이 남음.
  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword);
    setDraft(keyword);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmitKeyword(draft.trim());
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={className}>
      <SearchInput
        variant="filled"
        // Figma는 테두리까지 포함해 높이 40이라 세로 여백을 1px씩 줄임.
        className="py-2.25"
        aria-label={t("list.search.label")}
        placeholder={t("list.search.placeholder")}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    </form>
  );
}
