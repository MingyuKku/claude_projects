import { cva } from "class-variance-authority";
import { CircleAlert } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

// Figma Inform(6925:65640): Type(Line/Filled) × Size(md/sm), 위·아래 구분선 선택.
const informVariants = cva("flex w-full flex-col", {
  variants: {
    variant: {
      line: "",
      filled: "rounded-lg border bg-muted/40",
    },
    size: {
      md: "gap-5",
      sm: "gap-4",
    },
  },
  compoundVariants: [
    { variant: "filled", size: "md", className: "p-5" },
    { variant: "filled", size: "sm", className: "gap-3.5 px-4 py-3" },
  ],
  defaultVariants: { variant: "line", size: "md" },
});

const SIZE_STYLES = {
  md: {
    container: "gap-4",
    title: "text-base",
    list: "gap-2",
    row: "text-sm leading-5",
    icon: "size-4",
  },
  sm: {
    container: "gap-3",
    title: "text-sm",
    list: "gap-1",
    row: "text-xs leading-4",
    icon: "size-3",
  },
} as const;

export interface InformItem {
  id: string;
  text: ReactNode;
}

interface InformProps extends VariantProps<typeof informVariants> {
  title?: ReactNode;
  items: InformItem[];
  hasLineTop?: boolean;
  hasLineBottom?: boolean;
  className?: string;
}

export function Inform({
  variant,
  size,
  title,
  items,
  hasLineTop = false,
  hasLineBottom = false,
  className,
}: InformProps) {
  const styles = SIZE_STYLES[size ?? "md"];
  return (
    <div className={cn(informVariants({ variant, size }), className)}>
      {hasLineTop && <hr className="border-border" />}
      <div className={cn("flex flex-col", styles.container)}>
        {title && (
          <p
            className={cn(
              "leading-none font-semibold text-foreground",
              styles.title,
            )}
          >
            {title}
          </p>
        )}
        <ul className={cn("flex flex-col", styles.list)}>
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex items-start gap-1.5 text-muted-foreground",
                styles.row,
              )}
            >
              <span className="flex shrink-0 pt-0.5">
                <CircleAlert aria-hidden className={styles.icon} />
              </span>
              <span className="min-w-0 flex-1">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
      {hasLineBottom && <hr className="border-border" />}
    </div>
  );
}
