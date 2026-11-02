import { Pencil } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

interface EditButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

// Figma 목록 행의 연필 버튼(10724:186016): 삭제 버튼과 같은 정사각 outline 아이콘 버튼.
export function EditButton({ label, onClick, className }: EditButtonProps) {
  return (
    <Button
      variant="outline-foreground"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className={cn("rounded-md", className)}
    >
      <Pencil />
    </Button>
  );
}
