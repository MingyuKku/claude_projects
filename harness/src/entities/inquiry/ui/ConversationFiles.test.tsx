import { render, screen } from "@testing-library/react";

import { ConversationFiles } from "./ConversationFiles";

import type { InquiryMessageViewModel } from "../model/schema";

function message(
  overrides: Partial<InquiryMessageViewModel>,
): InquiryMessageViewModel {
  return {
    id: 1,
    isMine: true,
    kind: "file",
    body: "https://cdn/a.pdf",
    createdAt: new Date("2026-10-30T10:00:00"),
    isDeleted: false,
    isRead: false,
    isEdited: false,
    senderId: null,
    campaign: null,
    attachment: {
      attachmentIdx: 2624,
      fileName: "견적서.pdf",
      fileSize: 2.5 * 1024 * 1024,
      fileType: "application/pdf",
    },
    ...overrides,
  };
}

describe("ConversationFiles", () => {
  it("문서는 이름·용량 카드로 보이고 다운로드 링크가 이미지 받기 경로를 가리킨다", () => {
    const doc = message({});
    render(
      <ConversationFiles
        name="광고주"
        row={{
          type: "files",
          id: 1,
          isMine: true,
          createdAt: doc.createdAt,
          text: null,
          messages: [doc],
        }}
      />,
    );

    // 파일 이름은 앞 5자 + "..."로 보이고(Figma REQ-23-0009), 전체 이름은 title과 내려받는 이름에 남음
    expect(screen.getByText("견적서.p...")).toHaveAttribute(
      "title",
      "견적서.pdf",
    );
    expect(screen.getByText("2.5MB")).toBeInTheDocument();
    const download = screen.getByRole("link", { name: "파일 받기" });
    expect(download.getAttribute("href")).toMatch(
      /\/v3\/help\/file\/download\/image\/2624$/,
    );
    expect(download).toHaveAttribute("download", "견적서.pdf");
  });
});
