import { Pencil } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

interface EditButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

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
