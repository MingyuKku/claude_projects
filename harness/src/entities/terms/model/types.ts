export type TermsBlock =
  | { type: "paragraph"; text: string; bold?: boolean }
  | { type: "table"; headers: string[]; rows: string[][] };
