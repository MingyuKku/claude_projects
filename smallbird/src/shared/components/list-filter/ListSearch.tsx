import { useState } from "react";

import { SearchInput } from "@/shared/components/search-input";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import type { FormEvent } from "react";

interface ListSearchProps {
  /** 적용된 검색어. 바뀌면(뒤로 가기 등) 입력칸도 맞추도록 호출하는 쪽이 key로 다시 그림. */
  keyword: string;
  onSubmitKeyword: (keyword: string) => void;
  /** 검색 기획이 정해지기 전에는 입력을 막음. */
  isDisabled?: boolean;
  className?: string;
}

// Enter로 검색하고 1쪽부터 다시 보여 줌.
export function ListSearch({
  keyword,
  onSubmitKeyword,
  isDisabled,
  className,
}: ListSearchProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(keyword);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmitKeyword(draft.trim());
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(isDisabled && "opacity-50", className)}
    >
      <SearchInput
        variant="filled"
        // Figma는 테두리까지 포함해 높이 40이라 세로 여백을 1px씩 줄임.
        className="py-2.25"
        aria-label={t("list.search.label")}
        placeholder={t("list.search.placeholder")}
        disabled={isDisabled}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    </form>
  );
}
