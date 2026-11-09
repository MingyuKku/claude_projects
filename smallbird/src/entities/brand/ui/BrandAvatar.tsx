import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";

import type { Brand } from "../model/schema";
import type { ComponentProps } from "react";

interface BrandAvatarProps {
  brand: Pick<Brand, "imageUrl">;
  size?: ComponentProps<typeof Avatar>["size"];
  className?: string;
}

/** 브랜드 이미지. 올리지 않은 브랜드는 기본 프로필을 보임. 이름은 옆 텍스트가 알려 주므로 장식으로 숨김. */
export function BrandAvatar({
  brand,
  size = "md",
  className,
}: BrandAvatarProps) {
  return (
    <Avatar size={size} className={className} aria-hidden>
      {brand.imageUrl && <AvatarImage src={brand.imageUrl} alt="" />}
      <AvatarPlaceholder />
    </Avatar>
  );
}
