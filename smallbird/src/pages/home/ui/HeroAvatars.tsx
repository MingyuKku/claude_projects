import heroAvatars from "@/shared/assets/img/home/hero-avatars.png";
import { cn } from "@/shared/lib/utils";

// Figma Avatar / Main(5084:104237): 296×80. 사진 4장과 가운데 기본 실루엣이 한 묶음(프레임)이라 디자인팀이 내보낸 3x 이미지를 그대로 씀.
// 이미지(306×82)에는 그림자 여백이 가로 5px·세로 1px씩 있어 음수 여백으로 상쇄함. 장식 이미지라 스크린 리더에서 숨김.
// Figma 내보내기 PNG의 불투명한 흰 바탕은 바깥에서 이어진 흰색·회색을 투명으로 바꾸고 그림자는 알파로 복원해 투명 PNG로 만듦.
// 디자인팀의 투명 배경 PNG(3x)를 받으면 같은 이름으로 교체함.
interface HeroAvatarsProps {
  className?: string;
}

export function HeroAvatars({ className }: HeroAvatarsProps) {
  return (
    <div aria-hidden className={cn("h-20 w-74", className)}>
      <img
        src={heroAvatars}
        alt=""
        className="-mx-1.25 -my-px h-20.5 w-76.5 max-w-none"
      />
    </div>
  );
}
