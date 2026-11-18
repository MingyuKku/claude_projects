import { Pencil } from "lucide-react";

import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

// Figma 디자인 시스템 Avatar / Edit(7046:124956): 88px 아바타 오른쪽 아래에 32px 연필 버튼.
interface AvatarEditProps {
  src?: string;
  alt: string;
  editLabel: string;
  onClickEdit?: () => void;
}

export function AvatarEdit({
  src,
  alt,
  editLabel,
  onClickEdit,
}: AvatarEditProps) {
  return (
    <div className="relative h-22 w-23">
      <Avatar size="5xl">
        {src && <AvatarImage src={src} alt={alt} />}
        <AvatarPlaceholder />
      </Avatar>
      <Button
        variant="outline-foreground"
        size="icon-sm"
        aria-label={editLabel}
        onClick={onClickEdit}
        className="absolute top-14 left-15"
      >
        <Pencil />
      </Button>
    </div>
  );
}
