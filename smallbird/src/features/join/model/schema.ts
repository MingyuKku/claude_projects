import { z } from "zod";

export const checkResultSchema = z.object({ result: z.number() });
export type CheckResult = z.infer<typeof checkResultSchema>;

export const validPasswordResultSchema = z.object({
  result: z.boolean(),
  reason: z.string().optional(),
});
export type ValidPasswordResult = z.infer<typeof validPasswordResultSchema>;

/** Values handed to the KMC window. The names are KMC's contract. */
export const certInitResultSchema = z.object({
  trCert: z.string(),
  trUrl: z.string(),
  trAdd: z.string(),
});
export type CertInitResult = z.infer<typeof certInitResultSchema>;

export const certDecryptResultSchema = z.object({
  result: z.union([z.string(), z.boolean()]).optional(),
  message: z.string().optional(),
  certIdx: z.number().optional(),
  phoneNumber: z.string().optional(),
  name: z.string().optional(),
});
export type CertDecryptResult = z.infer<typeof certDecryptResultSchema>;

export const joinResultSchema = z.object({
  result: z.string(),
  userIdx: z.number().optional(),
});
export type JoinResult = z.infer<typeof joinResultSchema>;

export const categorySchema = z.object({ id: z.number(), name: z.string() });
export type Category = z.infer<typeof categorySchema>;

export const categoryListResponseSchema = z.object({
  category: z.array(categorySchema),
});
