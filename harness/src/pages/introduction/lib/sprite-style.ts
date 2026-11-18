import { section4 } from "../model/data";

import type { CssVariableStyle } from "@/shared/lib";

interface SpriteCard {
  reverse: boolean;
}

const { sprites, layout } = section4;

function toPercent(numerator: number, denominator: number) {
  return `${(numerator / denominator) * 100}%`;
}

// PC: 이미지가 오른쪽인 카드(reverse)는 스프라이트에서 rightX 만큼 떨어진 곳에서 시작함.
function pcSpritePosition(index: number, card: SpriteCard) {
  const x = card.reverse ? -layout.pc.rightX : 0;
  return `${x}px -${index * layout.pc.pitch}px`;
}

// MO 레이아웃은 이미지가 위에 놓여 가로 오프셋이 없음.
function moSpritePosition(index: number) {
  return `0px -${index * layout.mo.pitch}px`;
}

/**
 * 섹션 4 카드 이미지가 쓰는 화면별(PC·TAB·MO) 스프라이트 값을 CSS 변수로 만듦.
 *
 * 카드마다 좌표가 달라 미디어 쿼리만으로는 고를 수 없으므로 세 벌을 모두 변수로 넣고 스타일이 고름.
 *
 * TAB 만 %로 환산함. 768~1239 사이에서는 이미지 박스가 커지는데 px 배경은 따라 커지지 않아
 * 오른쪽이 비기 때문(디자인 QA). %를 쓰면 박스 크기와 무관하게 같은 셀이 같은 비율로 커짐.
 *   size     = 스프라이트 / 셀 크기 (박스가 aspect-ratio 를 유지하므로 성립)
 *   position = 오프셋 / (스프라이트 - 셀) - %는 절대 거리가 아니라 남는 공간에 대한 비율.
 * PC 박스는 794x400 고정이고 MO 는 세로 간격과 박스 높이가 달라 px 로 둠.
 */
export function createSpriteStyle(
  index: number,
  card: SpriteCard,
): CssVariableStyle {
  const { tab } = layout;
  const tabSprite = sprites.tab;

  return {
    "--s4-pc-img": `url(${sprites.pc.src})`,
    "--s4-pc-size": `${sprites.pc.w}px ${sprites.pc.h}px`,
    "--s4-pc-pos": pcSpritePosition(index, card),
    "--s4-tab-img": `url(${tabSprite.src})`,
    "--s4-tab-size": `${toPercent(tabSprite.w, tab.imgW)} ${toPercent(tabSprite.h, tab.imgH)}`,
    "--s4-tab-pos": [
      card.reverse ? toPercent(tab.rightX, tabSprite.w - tab.imgW) : "0%",
      toPercent(index * tab.pitch, tabSprite.h - tab.imgH),
    ].join(" "),
    "--s4-mo-img": `url(${sprites.mo.src})`,
    "--s4-mo-size": `${sprites.mo.w}px ${sprites.mo.h}px`,
    "--s4-mo-pos": moSpritePosition(index),
  };
}
