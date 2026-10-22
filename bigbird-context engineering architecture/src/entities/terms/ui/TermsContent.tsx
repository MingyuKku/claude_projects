import { AuthText } from "@/shared/components/auth";

import type { TermsBlock } from "../model/types";

type TermsTableBlock = Extract<TermsBlock, { type: "table" }>;

interface TermsTableProps {
  block: TermsTableBlock;
}

// 좁은 화면에서는 본문이 아니라 표만 가로로 스크롤됨.
function TermsTable({ block }: TermsTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {block.headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="border border-gray-200 bg-hover p-2"
              >
                <AuthText as="span" size="xs" weight="bold">
                  {header}
                </AuthText>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border border-gray-200 p-2 align-top"
                >
                  <AuthText as="span" size="xs" className="whitespace-pre-line">
                    {cell}
                  </AuthText>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TermsContentProps {
  content: TermsBlock[];
}

// 블록은 정적 문서라 순서가 곧 문서 순서이고 바뀌지 않으므로, 인덱스가 안정적인 key.
export function TermsContent({ content }: TermsContentProps) {
  return (
    <>
      {content.map((block, index) =>
        block.type === "table" ? (
          <TermsTable key={index} block={block} />
        ) : (
          <AuthText
            key={index}
            size="sm"
            weight={block.bold ? "bold" : "normal"}
            className="whitespace-pre-line"
          >
            {block.text}
          </AuthText>
        ),
      )}
    </>
  );
}
