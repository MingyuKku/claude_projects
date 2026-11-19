import { GuideButton } from "@/shared/components/guide-button";
import { LanguageMenu } from "@/shared/components/language-menu";
import {
  changeLanguage,
  isLanguage,
  useLanguage,
  useTranslation,
} from "@/shared/i18n";

import { LANGUAGE_OPTIONS } from "../model/languages";

interface GuideLanguageButtonsProps {
  onClickGuide: () => void;
  /** 언어 메뉴가 열리는 위치. 헤더는 아래·오른쪽 정렬, LNB 하단은 위·왼쪽 정렬. */
  placement: "header" | "sidebar";
}

// 이용 가이드와 언어 메뉴 한 쌍. 비로그인은 헤더에, 로그인은 LNB 하단에 둠.
export function GuideLanguageButtons({
  onClickGuide,
  placement,
}: GuideLanguageButtonsProps) {
  const { t } = useTranslation("widgets/app-shell");
  const language = useLanguage();

  function handleChangeLanguage(nextLanguage: string) {
    if (isLanguage(nextLanguage)) void changeLanguage(nextLanguage);
  }

  const options = LANGUAGE_OPTIONS.map(
    ({ value, code, nativeName, nameKey }) => ({
      value,
      code,
      label: `${nativeName} (${t(nameKey)})`,
    }),
  );
  const isHeader = placement === "header";

  return (
    <>
      <GuideButton label={t("guide")} onClick={onClickGuide} />
      <LanguageMenu
        value={language}
        options={options}
        menuLabel={t("language.label")}
        onChangeLanguage={handleChangeLanguage}
        contentSide={isHeader ? "bottom" : "top"}
        contentAlign={isHeader ? "end" : "start"}
        // LNB 하단은 이미 시트(오버레이) 안이라 드로어를 겹치지 않고 메뉴로 엶.
        isDrawerOnMobile={isHeader}
      />
    </>
  );
}
