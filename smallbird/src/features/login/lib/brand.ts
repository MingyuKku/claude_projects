import bigbirdLogo from "@/shared/assets/img/auth/bigbird-logo.svg";
import petplayLogo from "@/shared/assets/img/auth/petplay-logo.svg";

import type { BrandTheme } from "../model/types";

// 한 배포가 두 도메인(빅버드, 펫플레이)을 함께 서비스함. 백엔드·OAuth·리다이렉트는
// 공유하고, 호스트명에 따라 로그인 화면 브랜딩만 다름.

const bigbirdTheme: BrandTheme = {
  id: "bigbird",
  logo: bigbirdLogo,
  logoClassName: "w-35 tablet:w-42.5",
  primaryColor: null,
  shouldShowQuestion: true,
};

const petplayTheme: BrandTheme = {
  id: "petplay",
  logo: petplayLogo,
  logoClassName: "w-41.25 tablet:w-45.5 desktop:w-51.5",
  primaryColor: "#f79000",
  shouldShowQuestion: false,
};

const PETPLAY_HOST_KEYWORD = "petplay";
// QA가 로컬·스테이지 호스트에서 펫플레이 화면을 강제로 볼 수 있게 함.
const BRAND_QUERY_KEY = "brand";
const PETPLAY_BRAND_PARAM = "petplay";

export function resolveBrand(hostname: string, search = ""): BrandTheme {
  if (hostname.includes(PETPLAY_HOST_KEYWORD)) return petplayTheme;
  if (
    new URLSearchParams(search).get(BRAND_QUERY_KEY) === PETPLAY_BRAND_PARAM
  ) {
    return petplayTheme;
  }
  return bigbirdTheme;
}
