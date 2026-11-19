import { FileQuestionMark } from "lucide-react";

import { Button } from "@/shared/ui/button";

interface GuideButtonProps {
  label: string;
  onClick?: () => void;
}

export function GuideButton({ label, onClick }: GuideButtonProps) {
  return (
    <Button
      variant="ghost-muted"
      size="sm"
      className="cursor-pointer"
      onClick={onClick}
    >
      <FileQuestionMark />
      {label}
    </Button>
  );
}
