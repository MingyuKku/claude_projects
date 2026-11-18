import { cn } from "@/shared/lib";

// 호버 전환(디자인 QA: Figma 프로토타입 "While hovering / Smart animate / Easing Slow / 400ms").
// 더 느리게 느껴지도록 요청에 따라 400ms 에서 900ms 로 늘림. 곡선이 끝에서 부드럽게 가라앉아
// 같은 시간도 더 여유 있게 보임.
export const HOVER = "duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]";

// 목업과 오버레이는 페이드하지 않음. 900ms 동안 두 목업이 잔상처럼 함께 비쳤기 때문.
// 한 번에 하나만 보이고(opacity 는 즉시 전환) 크기만 움직임.
// Tailwind v4 의 transition-transform 은 transform 뿐 아니라 translate 와 scale 도 포함함.
export const MOVE = `transition-transform ${HOVER}`;

/** 폰 화면 안에서 캡처가 스크롤되는 오버레이(카드 2·3)의 클래스. */
export interface PhoneScreenClasses {
  screen: string;
  screenVars: string;
  screenBody: string;
  screenScroll: string;
}

export interface CardClasses {
  imgDefault: string;
  imgHover: string;
  phoneScreen?: PhoneScreenClasses;
}

// 카드마다 목업 크기와 위치가 다름. 숫자는 디자인의 좌표(left-1/2 + translate-x 가 기준이고,
// 카드 중앙에서의 오프셋을 더함).
//
// 호버하면 목업이 커지면서 이미지가 바뀜(디자인 QA). 크기가 이어지므로 이미지 교체가 눈에 띄지 않음.
//   진입: 호버 목업이 작게 나타나 원래 크기로 커짐
//   이탈: 기본 목업이 확대된 채 나타나 원래 크기로 줄어듦
// 카드 1의 두 목업은 비율이 같아(364x303 / 535x445 = 1.20) 배율이 바로 나옴.
// 시작 364/535 = 0.681, 역 1.470.
// 카드 2·3은 기본 목업과 호버 목업이 서로 다른 파일이라 이미지 크기가 대응하지 않음
// (353 -> 1208, 3.4배면 화면을 뚫고 나감). 대신 각 목업에 그려진 "폰 화면"의 폭을 맞춤.
// 프로토타입에서 같은 폰이 커지는 것처럼 보이는 이유.
//   기본 화면 353.1 * (433/820) = 186.4, 호버 화면 245
//   -> 245/186.4 = 1.32, 역 0.76
// 배율은 PC 에서만 적용함. TAB 은 목업 좌표가 다름.
export const CARD_CLASSES: readonly CardClasses[] = [
  {
    // 카드 1: PC 데스크톱 목업, 중앙에서 오른쪽으로 96.5px.
    imgDefault:
      "top-[15px] h-[303px] w-[364px] translate-x-[calc(-50%+96.5px)] max-introtab:translate-x-[-50%] max-mo:translate-x-[calc(-50%+46px)] introtab:group-hover:scale-[1.47]",
    imgHover:
      "top-[30px] h-[445px] w-[535px] translate-x-[-50%] introtab:scale-[0.681] introtab:group-hover:scale-100",
  },
  {
    // 카드 2 기본: 세로형 폰 목업. 디자인 박스는 350x781 에 object-cover.
    // 1708x3778 원본이 박스보다 넓어 cover 는 높이에 맞추고 양옆을 1.5px 씩 자름(그려지는 폭 353.1).
    // 에셋은 위쪽 1560px 만 남겨 두었으므로 높이는 원본 * (1560/3778) = 0.4129.
    imgDefault: cn(
      "top-[-16px] h-[322.5px] w-[353.1px] translate-x-[calc(-50%+0.5px)]",
      // TAB: 410x915 박스, 카드 중앙(688)에서 왼쪽으로 4px.
      "max-introtab:top-[-20px] max-introtab:h-[377.8px] max-introtab:w-[413.7px] max-introtab:translate-x-[calc(-50%-4px)]",
      // MO: 354x789 박스, 320 카드의 정중앙.
      "max-mo:top-[-21px] max-mo:h-[325.8px] max-mo:w-[356.7px] max-mo:translate-x-[-50%]",
      "introtab:group-hover:scale-[1.32]",
    ),
    // 카드 2·3은 호버 때 같은 Blue 목업을 씀.
    imgHover:
      "top-[-91px] h-[736px] w-[1208px] translate-x-[calc(-50%-18.5px)] introtab:scale-[0.76] introtab:group-hover:scale-100",
    phoneScreen: {
      // 목업 화면 안의 스크롤: 목업은 그대로 두고 폰 "화면"만 오려 내어 그 안에서 전체 캡처가 흐름.
      // 화면 영역은 s1-mockup.png(1800x1100)의 픽셀에서 측정함.
      // 베젤(rgb 50,50,57)과 화면이 만나는 곳이 x 743..1107(폭 365), y 180..931(높이 752).
      // 1208x736 호버 목업으로 환산하면:
      //   left 1208 * 743/1800 = 498.6 -> 목업 중앙에서 -123.9px
      //   top  736 * 180/1100 = 120.4 -> 목업 위(-91px)에서 29.4px 아래
      //   크기 245.0 x 503.2
      // 폭 361 에서는 구워진 화면의 베이지색 띠가 오른쪽 4px 에 비침.
      // 측정한 반경은 약 38(환산 25.5)이지만 반경이 작으면 모서리에서 오버레이가 베젤 위로 삐져나오므로,
      // 안쪽으로만 잘리도록 조금 크게 잡음.
      //
      // TAB·MO 는 호버가 없어 목업이 기본 폰 이미지로 남음. 캡처는 그 폰 화면에 올라가 계속 흐름.
      // 화면 위치는 기본 목업(820x749)에서 측정했고 카드 2·3이 같음(원본 공유):
      // 본체 x193..649, 화면 x205..637(폭 433), 화면 위 95.
      // 폭은 여러 행(y 200/300/500/700)에서 잴 것. y 120 에서는 모서리 둥글림 때문에 20px 좁게 읽혀
      // 구워진 화면이 양옆에 비침. 이미지는 화면마다 다른 크기로 놓이므로 값에 렌더 비율(렌더 폭 / 820)을 곱함.
      // 아래는 폭 413.7 의 TAB(0.5045)과 폭 356.7 의 MO(0.435) 기준.
      screen: cn(
        "max-introtab:top-[27.9px] max-introtab:left-[calc(50%-107.4px)] max-introtab:h-[258px] max-introtab:w-[218.5px]",
        // 아래 286px 카드 이미지 프레임이 잘라 주므로 아래쪽 반경은 없음.
        "max-introtab:rounded-t-[25.8px] max-introtab:rounded-b-none",
        "max-mo:top-[20.3px] max-mo:left-[calc(50%-89.2px)] max-mo:h-[266px] max-mo:w-[188.4px] max-mo:rounded-t-[22.2px]",
      ),
      // 세로 이동 거리 = 캡처 렌더 높이 - 보이는 높이 + 시작 오프셋.
      // 방향은 한쪽: 아래로 스크롤한 뒤 시작점으로 되돌아감(되감기 없음).
      // 속도는 약 69px/s. PC 호버는 마우스가 올라와 있는 동안만 돌아 103px/s 가 맞지만,
      // 여기서는 화면에 있는 내내 돌아 같은 속도면 어수선해 보이므로 1.5배 느리게 함.
      screenVars:
        "max-introtab:[--s1-scroll-dist:-1026px] max-introtab:[--s1-scroll-dur:15s] max-mo:[--s1-scroll-dist:-841px] max-mo:[--s1-scroll-dur:12.3s]",
      screenBody: "max-introtab:top-[52.9px] max-mo:top-[45.3px]", // 헤더 54.9 - 2
      // 727x4096 캡처는 245 * 4096/727 = 1380px 높이로 그려짐.
      // 화면 박스는 카드 아래로 넘쳐 잘리므로 캡처 끝을 보이는 하단선에 맞춤(카드 436 - 화면 위 29.4 = 406.6):
      //   59.5 + 1380 + ty = 406.6  ->  ty = -1033
      // 카드가 커지는 0.3s 가 끝나면 일정한 속도(약 103px/s)로 흐름.
      // transition 대상은 transform 이 아니라 translate. Tailwind v4 의 translate-y 는
      // CSS translate 속성을 쓰므로 transform transition 은 움직이지 않음.
      screenScroll:
        "introtab:group-hover:translate-y-[-1033px] introtab:group-hover:[transition:translate_10s_linear_0.3s]",
    },
  },
  {
    // 카드 3 기본: 카드 2와 같은 목업 에셋(1708x3778 중 위쪽 1560 으로 자름)이라 값이 같음.
    // 디자인에서 카드 3만 세 화면 모두 350x774 로, TAB 에서 카드 2보다 17% 작게 되어 있음.
    // 디자인 누락으로 보고 카드 2의 규칙을 따름.
    imgDefault: cn(
      "top-[-16px] h-[322.5px] w-[353.1px] translate-x-[calc(-50%+0.5px)]",
      "max-introtab:top-[-20px] max-introtab:h-[377.8px] max-introtab:w-[413.7px] max-introtab:translate-x-[calc(-50%-4px)]",
      "max-mo:top-[-21px] max-mo:h-[325.8px] max-mo:w-[356.7px] max-mo:translate-x-[-50%]",
      "introtab:group-hover:scale-[1.32]",
    ),
    imgHover:
      "top-[-91px] h-[736px] w-[1208px] translate-x-[calc(-50%-18.5px)] introtab:scale-[0.76] introtab:group-hover:scale-100",
    phoneScreen: {
      // 목업이 카드 2와 같으므로 화면 위치도 같음.
      screen: cn(
        "max-introtab:top-[27.9px] max-introtab:left-[calc(50%-107.4px)] max-introtab:h-[258px] max-introtab:w-[218.5px]",
        "max-introtab:rounded-t-[25.8px] max-introtab:rounded-b-none",
        "max-mo:top-[20.3px] max-mo:left-[calc(50%-89.2px)] max-mo:h-[266px] max-mo:w-[188.4px] max-mo:rounded-t-[22.2px]",
      ),
      // 캡처(380x4096)와 헤더(900x224)가 카드 2와 달라 이동 거리와 시작 오프셋을 따로 정함.
      //   TAB 헤더 218.5 * 224/900 = 54.4 -> 시작 52.4
      //       캡처 4096 * 218.5/380 = 2355.2, 거리 2355.2 - 258 + 52.4 =
      //       2149.6 -> 69px/s 에서 31.2s
      //   MO  헤더 188.4 * 224/900 = 46.9 -> 시작 44.9
      //       캡처 4096 * 188.4/380 = 2030.9, 거리 2030.9 - 266 + 44.9 =
      //       1809.8 -> 26.2s
      screenVars:
        "max-introtab:[--s1-scroll-dist:-2150px] max-introtab:[--s1-scroll-dur:31.2s] max-mo:[--s1-scroll-dist:-1810px] max-mo:[--s1-scroll-dur:26.2s]",
      screenBody: "max-introtab:top-[52.4px] max-mo:top-[44.9px]",
      // 380x4096 캡처는 245 * 4096/380 = 2641px 높이로 그려짐:
      // 59.5 + 2641 + ty = 406.6 -> ty = -2294.
      screenScroll:
        "introtab:group-hover:translate-y-[-2294px] introtab:group-hover:[transition:translate_22.3s_linear_0.3s]",
    },
  },
];
