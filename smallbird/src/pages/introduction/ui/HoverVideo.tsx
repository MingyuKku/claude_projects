import { cn } from "@/shared/lib";

import { MOVE } from "../lib/section1-card-classes";

interface Props {
  src: string;
  /** canplay 가 도착해 재생할 수 있는 상태인지. 그 전에는 목업에 구워진 화면이 보임. */
  isReady: boolean;
  onCanPlay: () => void;
  ref?: React.Ref<HTMLVideoElement>;
}

// 목업 화면 안에서 재생되는 비디오. 파일이 없으면 canplay 가 오지 않아 숨겨진 채로 남고,
// 목업에 구워진 화면이 보임.
// 호버 목업(535x445)의 화면 영역은 자체 디자인 노드: 목업 기준 left 22 / top 22 / 491x277(16:9).
// 목업은 top:30 에 translateX(-50%) 로 놓이므로
//   left = 중앙 - 267.5 + 22 = 중앙 - 245.5, top = 30 + 22 = 52
// 목업 폭이 535(디자인 534.587)이므로 폭은 491 * 535/534.587 = 491.4.
// TAB·MO 는 호버가 없어 목업이 기본 이미지(364x303)로 남고, 비디오는 그 목업의 화면에 올라감
// (측정 x 16..349.5 / y 15..203, 16:9):
//   TAB: 가운데 -> left = 중앙 - 182 + 16
//   MO : 중앙에서 +46 -> left = 중앙 - 182 + 16 + 46
export function HoverVideo({ src, isReady, onCanPlay, ref }: Props) {
  return (
    <span
      className={cn(
        "absolute top-[52px] left-[calc(50%-245.5px)] h-[277px] w-[491.4px] overflow-hidden opacity-0",
        MOVE,
        // 비디오(1916x926 = 2.07:1)는 화면 박스(1.77:1)보다 납작함.
        // 원본 오른쪽의 4px 검은 띠는 잘라 냈고 2배속 재생은 파일에 구워 넣음(디자인 QA).
        // cover 는 양옆을 7.2% 씩 잘라 왼쪽 로고와 오른쪽 '선정' 버튼을 잃으므로,
        // 폭을 채우고 비디오를 위에 붙인 뒤 아래 빈 곳을 비디오 맨 아래 행의 색(#999)으로 칠함.
        // 그 행은 가로로 균일해 이음매가 보이지 않음. 491:277 로 다시 인코딩하면 이 처리가 필요 없음.
        "bg-[#999]",
        // 스케일 기준점: 목업 중앙(50%, 30+222.5)을 오버레이 기준(50%-245.5, 52)으로 환산한 값.
        "introtab:origin-[245.5px_200.5px] introtab:scale-[0.681] introtab:group-hover:scale-100",
        "max-introtab:top-[30px] max-introtab:left-[calc(50%-166px)] max-introtab:h-[188px] max-introtab:w-[333.5px] max-mo:left-[calc(50%-120px)]",
        // 비디오가 재생 가능해진 뒤에만 목업 화면을 덮음. TAB·MO 는 호버가 없어 기본 상태에서 보이며(디자인 QA),
        // 재생은 autoplay + loop 가 맡고 stop 은 폭 기준으로 멈추지 않음.
        isReady && "max-introtab:opacity-100 introtab:group-hover:opacity-100",
      )}
    >
      <video
        className="block h-full w-full object-contain object-top"
        ref={ref}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onCanPlay={onCanPlay}
      />
    </span>
  );
}
