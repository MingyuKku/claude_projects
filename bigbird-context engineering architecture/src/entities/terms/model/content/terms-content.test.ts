import * as ko from "./ko";

import type { TermsBlock } from "../types";

// 번역본이 한국어 원문과 같은 구조(블록 수·종류·표 크기)와 같은 수치·연락처를 갖는지 확인함.
// 법적 문서라 번역 과정에서 문단이 빠지거나 숫자가 바뀌지 않았는지가 가장 중요함.

type DocumentName = "PRIVACY_POLICY_CONTENT" | "TERMS_OF_SERVICE_CONTENT";
type Documents = Record<DocumentName, TermsBlock[]>;

const DOCUMENTS: DocumentName[] = [
  "PRIVACY_POLICY_CONTENT",
  "TERMS_OF_SERVICE_CONTENT",
];
const TRANSLATED = ["en", "ja", "zh-CN"] as const;

const URL_PATTERN = /https?:\/\/[^\s)'"”’]+/g;
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const NUMBER_PATTERN = /\d+/g;
// 법령·기관 이름처럼 한국어 원문을 괄호로 병기하는 것은 허용하고, 그 밖의 한글은 번역 누락으로 봄.
const BRACKETED_KOREAN_PATTERN =
  /[「『(（[][^「」『』()（）[\]]*[가-힣][^「」『』()（）[\]]*[」』)）\]]/g;

function blockText(block: TermsBlock): string {
  return block.type === "paragraph"
    ? block.text
    : [...block.headers, ...block.rows.flat()].join("\n");
}

function sorted(matches: RegExpMatchArray | null): string[] {
  return [...(matches ?? [])].sort();
}

async function load(language: (typeof TRANSLATED)[number]): Promise<Documents> {
  return (await import(`./${language}.ts`)) as Documents;
}

describe.each(TRANSLATED)("약관 번역 %s", (language) => {
  describe.each(DOCUMENTS)("%s", (name) => {
    it("블록 구조가 한국어 원문과 같다", async () => {
      const translated = (await load(language))[name];
      const source = ko[name];

      expect(translated).toHaveLength(source.length);
      source.forEach((block, index) => {
        const target = translated[index];
        expect(target?.type, `block ${index} type`).toBe(block.type);
        if (block.type === "paragraph" && target?.type === "paragraph") {
          expect(Boolean(target.bold), `block ${index} bold`).toBe(
            Boolean(block.bold),
          );
          expect(target.text.trim(), `block ${index} empty`).not.toBe("");
        }
        if (block.type === "table" && target?.type === "table") {
          expect(target.headers, `block ${index} headers`).toHaveLength(
            block.headers.length,
          );
          expect(target.rows, `block ${index} rows`).toHaveLength(
            block.rows.length,
          );
          block.rows.forEach((row, rowIndex) => {
            expect(
              target.rows[rowIndex],
              `block ${index} row ${rowIndex}`,
            ).toHaveLength(row.length);
          });
        }
      });
    });

    it("URL·이메일·숫자가 블록마다 한국어 원문과 같다", async () => {
      const translated = (await load(language))[name];
      ko[name].forEach((block, index) => {
        const target = translated[index];
        if (!target) return;
        const sourceText = blockText(block);
        const targetText = blockText(target);
        for (const [label, pattern] of [
          ["url", URL_PATTERN],
          ["email", EMAIL_PATTERN],
          ["number", NUMBER_PATTERN],
        ] as const) {
          expect(
            sorted(targetText.match(pattern)),
            `block ${index} ${label}`,
          ).toEqual(sorted(sourceText.match(pattern)));
        }
      });
    });

    it("번역되지 않은 한글이 남아 있지 않다", async () => {
      const translated = (await load(language))[name];
      translated.forEach((block, index) => {
        const stripped = blockText(block).replace(BRACKETED_KOREAN_PATTERN, "");
        expect(stripped.match(/[가-힣]+/g) ?? [], `block ${index}`).toEqual([]);
      });
    });
  });
});
