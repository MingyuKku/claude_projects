import { useTranslation } from "@/shared/i18n";
import { SessionAppShell } from "@/widgets/app-shell";

import { HomeContent } from "./HomeContent";

// iOS에서 키보드가 떠 있는 동안 본문 아래 끝과 셸 아래(키보드 뒤)를 칠할 배경. 본문 배경(HomeContent)의 아래 끝 색을 가로로 이음.
// 태블릿은 본문과 같은 가로 그라데이션이라 그대로 이어짐. 모바일 본문은 116.9° 대각선 그라데이션이라 아래 끝이 왼쪽 blue-100,
// 60% 지점 blue-50, 오른쪽 blue-200(폭 390·높이 450 기준 계산)이 되어 그 색을 가로 그라데이션으로 근사함.
const KEYBOARD_GAP_CLASS_NAME =
  "bg-[linear-gradient(to_right,var(--color-blue-100),var(--color-blue-50)_60%,var(--color-blue-200))] tablet:bg-linear-to-l tablet:from-background tablet:to-blue-100";

// 공개 홈(`/`). 로그인 여부와 관계없이 같은 본문이고, 셸(헤더·LNB)만 로그인 상태에 따라 달라짐.
// 페이지 제목(h1)은 셸 헤더가 맡고 히어로 문구는 h2.
export function HomePage() {
  const { t } = useTranslation("pages/home");

  return (
    <>
      <title>{t("title")}</title>
      <SessionAppShell
        mainClassName="p-0"
        isKeyboardAware
        keyboardGapClassName={KEYBOARD_GAP_CLASS_NAME}
      >
        <HomeContent />
      </SessionAppShell>
    </>
  );
}
