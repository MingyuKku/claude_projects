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
    isRead: false,
    isEdited: false,
    senderId: null,
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

describe("groupAttachments: 첨부 body 판정", () => {
  it.each([
    "https://cdn/a.png",
    "//cdn/a.png",
    "/upload/a.png",
    "upload/a.png",
    "blob:https://biz.bigbird.co.kr/1234",
    "data:image/png;base64,AAAA",
  ])("파일 주소 %s는 글로 보지 않는다", (body) => {
    const rows = groupAttachments([file({ body })]);
    expect(rows[0]).toMatchObject({ type: "files", text: null });
  });

  it.each(["출금 요청이 접수되었습니다.", "Note: thanks", "감사합니다"])(
    "글 %s는 말풍선으로 쓴다",
    (body) => {
      const rows = groupAttachments([file({ body })]);
      const [row] = rows;
      // 한 단어짜리 글은 주소와 구분되지 않지만 `/`가 없어 글로 봄.
      expect(row?.type === "files" && row.text?.body).toBe(body);
    },
  );
});

describe("groupAttachments", () => {
  it("글과 첨부를 한 메시지로 저장한 첨부(body가 글)는 그 글을 말풍선으로 쓰고 첨부를 아래에 붙인다", () => {
    const rows = groupAttachments([
      file({
        body: "출금 요청이 접수되었습니다.",
        attachment: {
          attachmentIdx: 2870,
          fileName: "통장.jpeg",
          fileSize: null,
          fileType: "image/jpeg",
        },
      }),
    ]);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    // 첨부가 달린 메시지의 글은 수정·삭제 대상이 아니라서 임시 id(≤ 0)를 씀.
    expect(row?.type === "files" && row.text && row.text.id <= 0).toBe(true);
    expect(row).toMatchObject({
      type: "files",
      text: {
        kind: "text",
        body: "출금 요청이 접수되었습니다.",
        attachment: null,
      },
      messages: [{ attachment: { attachmentIdx: 2870 } }],
    });
  });

  it("같은 쪽이 연달아 보낸 첨부는 한 줄로 묶는다", () => {
    const rows = groupAttachments([file(), file(), file()]);
    expect(rows.map((row) => row.type)).toEqual(["files"]);
    expect(rows[0]!.type === "files" && rows[0]!.messages).toHaveLength(3);
  });

  it("사진·영상과 문서가 바뀌는 곳에서 묶음을 끊어 보낸 순서를 지킨다", () => {
    const doc = () =>
      file({
        kind: "file",
        body: "https://cdn/a.pdf",
        attachment: {
          attachmentIdx: 2,
          fileName: "a.pdf",
          fileSize: 1,
          fileType: "file",
        },
      });
    const rows = groupAttachments([
      file(),
      file({ kind: "video" }),
      doc(),
      doc(),
      file(),
    ]);
    expect(
      rows.map((row) =>
        row.type === "files" ? row.messages.map((item) => item.kind) : [],
      ),
    ).toEqual([["image", "video"], ["file", "file"], ["image"]]);
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
