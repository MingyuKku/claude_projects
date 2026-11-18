/** 폼 아래에 보여 줄 문구의 번역 키(`error.{code}`). */
export type LoginMessageCode =
  | "idRequired"
  | "passwordRequired"
  | "mismatch"
  | "unknown"
  | "exited"
  | "noAccount"
  | "lockedTemporarily"
  | "destroyed";

export interface LoginMessage {
  code: LoginMessageCode;
  /** 번역 문구에 끼울 값(`count`는 복수형 선택에도 쓰임). */
  values?: Record<string, string | number | Date>;
}

export interface LoginErrorResult {
  /** 폼 아래에 보여 줄 메시지. 아래 플래그가 화면 전환을 맡으면 null. */
  message: LoginMessage | null;
  /** 계정 잠금 안내 팝업을 띄움. */
  isLocked: boolean;
  /** 사용자를 휴면 계정 화면으로 보냄. */
  isExpired: boolean;
}

export interface BrandTheme {
  /** 번역 키(`brand.{id}.…`)를 고르는 값. */
  id: "bigbird" | "petplay";
  logo: string;
  /** 로고 너비: 모바일, 태블릿, 데스크톱 순. */
  logoClassName: string;
  /** null이면 기본 `--brand`를 유지함. */
  primaryColor: string | null;
  /** 우측 상단 문의 진입점을 보여 줄지 여부. */
  shouldShowQuestion: boolean;
}
