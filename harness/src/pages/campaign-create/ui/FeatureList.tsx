import type { ReactNode } from "react";

interface FeatureListProps {
  items: { id: string; text: ReactNode }[];
}

export function FeatureList({ items }: FeatureListProps) {
  return (
    <ul className="flex flex-col gap-2 ds-px-5 ds-pt-5 pb-1">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-1.5 ds-text-sm-5-normal text-foreground"
        >
          <span className="flex size-3 shrink-0 translate-y-1 items-center justify-center">
            <span className="size-1.5 rounded-full bg-foreground" />
          </span>
          <span className="min-w-0 flex-1">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
