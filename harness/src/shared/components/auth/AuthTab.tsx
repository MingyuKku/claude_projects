import { cva } from "class-variance-authority";

import { AuthText } from "./AuthText";

const authTabVariants = cva(
  "flex h-[54px] flex-1 items-center justify-center",
  {
    variants: {
      isSelected: {
        true: "border-b-[3px] border-brand",
        false: "border-b border-gray-200",
      },
    },
  },
);

interface AuthTabProps {
  isSelected: boolean;
  label: string;
  onClick: () => void;
}

/** 탭 목록(`role="tablist"`) 안에서 쓰는 탭 버튼. 선택된 탭은 굵은 글씨와 브랜드색 밑줄. */
export function AuthTab({ isSelected, label, onClick }: AuthTabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={onClick}
      className={authTabVariants({ isSelected })}
    >
      <AuthText
        as="span"
        size="lg"
        weight={isSelected ? "bold" : "normal"}
        tone="heading"
      >
        {label}
      </AuthText>
    </button>
  );
}
