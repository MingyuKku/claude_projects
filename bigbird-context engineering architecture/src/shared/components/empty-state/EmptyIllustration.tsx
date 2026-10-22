import alarm from "@/shared/assets/img/empty/alarm.svg";
import construction from "@/shared/assets/img/empty/construction.svg";
import folder from "@/shared/assets/img/empty/folder.svg";
import noList from "@/shared/assets/img/empty/no-list.svg";
import noMessage from "@/shared/assets/img/empty/no-message.svg";
import noSearch from "@/shared/assets/img/empty/no-search.svg";
import { cn } from "@/shared/lib/utils";

// Figma Empty Base / Illustration(6782:95839). 50px 정사각 안에 원본 비율로 맞춤.
const ILLUSTRATIONS = {
  "no-list": noList,
  "no-message": noMessage,
  "no-search": noSearch,
  construction,
  folder,
  alarm,
} as const;

export type EmptyIllustrationType = keyof typeof ILLUSTRATIONS;

interface EmptyIllustrationProps {
  type: EmptyIllustrationType;
  className?: string;
}

export function EmptyIllustration({ type, className }: EmptyIllustrationProps) {
  return (
    <img
      src={ILLUSTRATIONS[type]}
      alt=""
      aria-hidden
      className={cn("size-12.5 shrink-0 object-contain", className)}
    />
  );
}
