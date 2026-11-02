import { SUPPORTED_LANGUAGES, useLanguage } from "@/shared/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

// ponytail: 개발 서버 전용 임시 언어 전환. 언어는 시작할 때 정해지므로 ?lng= 로 새로 고침.
// 디자인에 언어 전환 UI가 생기면 이 컴포넌트를 지움.
const DEV_LANGUAGE_FLAGS = {
  ko: "🇰🇷한국어",
  en: "🇺🇸영어",
  ja: "🇯🇵일본어",
  "zh-CN": "🇨🇳중국어",
};

export function DevLanguageSwitcher() {
  const language = useLanguage();

  function handleChangeLanguage(nextLanguage: string) {
    // 다른 쿼리는 두고 lng만 바꿈.
    const params = new URLSearchParams(window.location.search);
    params.set("lng", nextLanguage);
    window.location.search = params.toString();
  }

  return (
    <Select value={language} onValueChange={handleChangeLanguage}>
      <SelectTrigger size="sm" aria-label="개발용 언어 전환" className="w-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((supportedLanguage) => (
          <SelectItem key={supportedLanguage} value={supportedLanguage}>
            {DEV_LANGUAGE_FLAGS[supportedLanguage]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
