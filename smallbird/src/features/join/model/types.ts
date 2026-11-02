import { z } from "zod";

import type { CheckStatus } from "@/entities/account";

export const snsTokenDataSchema = z.object({
  platform: z.string(),
  email: z.string(),
  uid: z.string(),
});

/** Identity handed over when a visitor arrives from SNS and creates a new account. */
export type SnsTokenData = z.infer<typeof snsTokenDataSchema>;

export interface AccountFields {
  id: string;
  password: string;
  passwordAgain: string;
  name: string;
  phoneNumber: string;
  /** Filled once KMC verification finishes. null means not verified yet. */
  certIdx: number | null;
  email: string;
  idStatus: CheckStatus;
  emailStatus: CheckStatus;
}

export interface CompanyFields {
  companyName: string;
  companyContact: string;
  companyRegistrationNumber: string;
  /** Mail-order business report number split in three inputs: year, region, serial. */
  mailorderParts: [string, string, string];
  classification: string | null;
  companyUrl: string;
  companyRegistrationUploaded: boolean;
  mailorderUploaded: boolean;
  companyRegistrationFileName: string;
  companyRegistrationFileSize: string;
  mailorderFileName: string;
  mailorderFileSize: string;
}

export interface TermsFields {
  service: boolean;
  privacy: boolean;
}

export type JoinStage = "info" | "company" | "terms";

export interface JoinPayload {
  id: string;
  pw: string;
  certIdx: number;
  email: string;
  termsAgreed: boolean;
  personalInformationCollectionAgreed: boolean;
  companyName: string;
  contact: string;
  companyRegistrationNumber: string;
  mailorderBusinessNumber: string | null;
  classification: number | null;
  companyUrl: string | null;
}
