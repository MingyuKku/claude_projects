import { cn } from "@/shared/lib";

interface HomePageProps {
  className?: string;
}

export function HomePage({ className }: HomePageProps) {
  return (
    <main className={cn("p-8", className)}>
      <h1 className="text-2xl font-semibold">bigbird</h1>
    </main>
  );
}
