import { TrashIcon } from "@/shared/components/icons";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

interface DeleteButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

// 시안은 Toggle이지만 켜고 끄는 동작이 아니라 삭제 버튼이라 Button으로 그림.
export function DeleteButton({ label, onClick, className }: DeleteButtonProps) {
  return (
    <Button
      variant="outline-foreground"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className={cn("rounded-md", className)}
    >
      <TrashIcon />
    </Button>
  );
}
