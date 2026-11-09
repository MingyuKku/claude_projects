import type { CampaignDraft } from "@/entities/campaign";
import type { TermsKind } from "@/entities/terms";

export type PolicyKey = keyof CampaignDraft["policy"]["agreements"];

export interface PolicyItem {
  key: PolicyKey;
  /** 약관 전문 종류. 없으면 전문을 보여 줄 수 없어 ">"를 숨기고 체크만 받음(캠페인 운영 정책·리워드 및 결제 관련 정책은 원문 대기, 스펙 P-14). */
  termsKind?: Extract<TermsKind, "service" | "privacy">;
}

/** 7단계(와 8단계) 약관 동의 항목. 모두 필수이고 순서는 시안 순서임. */
export const POLICY_ITEMS: readonly PolicyItem[] = [
  { key: "service", termsKind: "service" },
  { key: "privacy", termsKind: "privacy" },
  { key: "operation" },
  { key: "reward" },
];
