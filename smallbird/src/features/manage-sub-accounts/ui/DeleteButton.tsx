import { Trash2 } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

interface DeleteButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

// Figma Toggle(trash): 40px 정사각, 반경 6, 테두리. 켜고 끄는 동작이 아니라 삭제 버튼이라 Button으로 그림.
export function DeleteButton({ label, onClick, className }: DeleteButtonProps) {
  return (
    <Button
      variant="outline-foreground"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className={cn("rounded-md", className)}
    >
      <Trash2 />
    </Button>
  );
}
