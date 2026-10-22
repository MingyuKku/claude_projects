import { groupAttachments } from "./group-attachments";

import type { InquiryMessageViewModel } from "../model/schema";

let id = 0;

function message(
  overrides: Partial<InquiryMessageViewModel> = {},
): InquiryMessageViewModel {
  return {
    id: ++id,
    isMine: true,
    kind: "text",
    body: "안녕하세요",
    createdAt: new Date(`2026-10-20T10:0${id % 10}:00`),
    isDeleted: false,
    campaign: null,
    attachment: null,
    ...overrides,
  };
}

const file = (overrides: Partial<InquiryMessageViewModel> = {}) =>
  message({
    kind: "image",
    body: "https://cdn/a.png",
    attachment: {
      attachmentIdx: 1,
      fileName: "a.png",
      fileSize: 1,
      fileType: "image",
    },
    ...overrides,
  });

describe("groupAttachments", () => {
  it("같은 쪽이 연달아 보낸 첨부는 한 줄로 묶는다", () => {
    const rows = groupAttachments([file(), file(), file()]);
    expect(rows.map((row) => row.type)).toEqual(["files"]);
    expect(rows[0]!.type === "files" && rows[0]!.messages).toHaveLength(3);
  });

  it("바로 앞에서 같은 쪽이 보낸 텍스트는 첨부와 한 묶음으로 합친다", () => {
    const text = message({ body: "확인 부탁드립니다" });
    const rows = groupAttachments([text, file(), file()]);
    expect(rows).toHaveLength(1);
    const [row] = rows;
    expect(row).toMatchObject({ type: "files", text });
    expect(row!.type === "files" && row!.messages).toHaveLength(2);
  });

  it("다른 쪽의 텍스트나 캠페인 카드는 합치지 않는다", () => {
    expect(
      groupAttachments([message({ isMine: false }), file()]).map(
        (row) => row.type,
      ),
    ).toEqual(["message", "files"]);
    expect(
      groupAttachments([
        message({ kind: "campaignCard", campaign: {} as never }),
        file(),
      ]).map((row) => row.type),
    ).toEqual(["message", "files"]);
  });

  it("보낸 쪽이 바뀌거나 텍스트가 두 개 이상 끼면 나눈다", () => {
    const rows = groupAttachments([
      file(),
      file({ isMine: false }),
      message(),
      message(),
      file(),
    ]);
    // 첨부 앞의 마지막 텍스트만 첨부와 합쳐지고, 그 앞 텍스트는 따로 남는다.
    expect(rows.map((row) => row.type)).toEqual([
      "files",
      "files",
      "message",
      "files",
    ]);
  });

  it("삭제된 첨부와 첨부 정보가 없는 이미지 메시지는 묶지 않는다", () => {
    const rows = groupAttachments([
      file({ isDeleted: true }),
      message({ kind: "image", attachment: null }),
    ]);
    expect(rows.map((row) => row.type)).toEqual(["message", "message"]);
  });
});
