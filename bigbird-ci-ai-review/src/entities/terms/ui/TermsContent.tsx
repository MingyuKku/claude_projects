import { AuthText } from "@/shared/components/auth";

import type { TermsBlock } from "../model/types";

interface Props {
  content: TermsBlock[];
}

// Blocks are a static document: order is the document order and never changes,
// so the index is a stable key here.
export function TermsContent({ content }: Props) {
  return (
    <>
      {content.map((block, index) =>
        block.type === "table" ? (
          // Only the table scrolls horizontally on narrow screens, not the body.
          <div key={index} className="w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {block.headers.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="border border-gray-200 bg-hover p-2"
                    >
                      <AuthText
                        as="span"
                        size="xs"
                        weight="bold"
                        className="text-gray-700!"
                      >
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
                        <AuthText
                          as="span"
                          size="xs"
                          className="whitespace-pre-line text-gray-700!"
                        >
                          {cell}
                        </AuthText>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AuthText
            key={index}
            size="sm"
            weight={block.bold ? "bold" : "normal"}
            className="whitespace-pre-line text-gray-700!"
          >
            {block.text}
          </AuthText>
        ),
      )}
    </>
  );
}
