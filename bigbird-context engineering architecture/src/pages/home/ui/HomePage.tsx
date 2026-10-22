import { useTranslation } from "@/shared/i18n";
import { SessionAppShell } from "@/widgets/app-shell";

import { HomeContent } from "./HomeContent";

// 공개 홈(`/`). 로그인 여부와 관계없이 같은 본문이고, 셸(헤더·LNB)만 로그인 상태에 따라 달라짐.
// 페이지 제목(h1)은 셸 헤더가 맡고 히어로 문구는 h2.
export function HomePage() {
  const { t } = useTranslation("pages/home");

  return (
    <>
      <title>{t("title")}</title>
      <SessionAppShell mainClassName="p-0" isKeyboardAware>
        <HomeContent />
      </SessionAppShell>
    </>
  );
}
