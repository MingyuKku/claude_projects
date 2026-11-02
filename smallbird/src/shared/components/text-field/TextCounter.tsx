import { cn } from "@/shared/lib/utils";

interface TextCounterProps {
  length: number;
  maxLength: number;
  className?: string;
}

// Figma Text Counter: 현재 글자 수 foreground, "/ 최대"는 muted-foreground.
export function TextCounter({
  length,
  maxLength,
  className,
}: TextCounterProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 text-xs leading-4 whitespace-nowrap text-muted-foreground",
        className,
      )}
    >
      <span className="text-foreground">{length}</span>
      <span aria-hidden="true">/</span>
      <span>{maxLength}</span>
    </span>
  );
}
