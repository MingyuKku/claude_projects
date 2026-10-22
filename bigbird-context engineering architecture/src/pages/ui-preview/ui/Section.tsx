import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-4 border-b py-8">
      <h2 className="typo-h4">{title}</h2>
      <div className="flex flex-wrap items-start gap-4 overflow-x-auto">
        {children}
      </div>
    </section>
  );
}
