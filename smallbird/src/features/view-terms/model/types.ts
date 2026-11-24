import type { TermsKind } from "@/entities/terms";

/** 로그인 계열 화면에서 여는 약관 종류. 충전 약관은 마이페이지 전용이라 제외함. */
export type ViewTermsKind = Exclude<TermsKind, "charge">;
