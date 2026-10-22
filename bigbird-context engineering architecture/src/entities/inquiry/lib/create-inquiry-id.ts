/** LAN HTTP에서도 상담 락·메시지 식별자를 생성함. */
export function createInquiryId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return hex.join("");
}
