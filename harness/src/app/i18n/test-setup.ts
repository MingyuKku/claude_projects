// 테스트는 모든 슬라이스의 ko 리소스로 초기화함. vitest.config.ts 의 setupFiles 에 등록함.
import { DEFAULT_LANGUAGE, initI18n } from "@/shared/i18n";

import { collectDefaultResources } from "./resources";

await initI18n({
  language: DEFAULT_LANGUAGE,
  resources: { [DEFAULT_LANGUAGE]: collectDefaultResources() },
});
