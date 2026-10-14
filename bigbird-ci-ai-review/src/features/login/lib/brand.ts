import bigbirdLogo from "@/shared/assets/img/auth/bigbird-logo.svg";
import petplayLogo from "@/shared/assets/img/auth/petplay-logo.svg";

import type { BrandTheme } from "../model/types";

// One deployment serves two domains (Bigbird and Petplay). Backend, OAuth and
// redirects are shared; only the login screen branding differs by hostname.

const bigbirdTheme: BrandTheme = {
  logo: bigbirdLogo,
  logoAlt: "빅버드 로고",
  logoClassName: "w-[140px] tablet:w-[154px] desktop:w-[174px]",
  tagline: "마케터의 감이 아닌\n빅데이터 AI 마케팅을 경험하세요.",
  loginTitle: "빅버드 파트너센터 로그인",
  primaryColor: null,
  showQuestion: true,
};

const petplayTheme: BrandTheme = {
  logo: petplayLogo,
  logoAlt: "펫플레이 로고",
  logoClassName: "w-[165px] tablet:w-[182px] desktop:w-[206px]",
  tagline: "펫프렌들리한 정보가 가득한\n펫플레이에서 놀자!",
  loginTitle: "펫플레이 파트너센터 로그인",
  primaryColor: "#f79000",
  showQuestion: false,
};

const PETPLAY_HOST_KEYWORD = "petplay";
// Lets QA force the Petplay screen on local and stage hosts.
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
