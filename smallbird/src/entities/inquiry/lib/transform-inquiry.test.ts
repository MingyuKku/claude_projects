import { describe, expect, it } from "vitest";

import {
  inquiryThreadListSchema,
  realtimeConsultationSchema,
} from "../model/schema";
import {
  buildSubmittedInquiryViewModel,
  toCampaignCardBody,
  transformBigbirdInquiryDetailMessages,
  transformBuyerInquiryDetailToViewModel,
  transformBuyerInquiryToViewModel,
  transformInquiryCampaignDetailToViewModel,
  transformInquiryCampaignToViewModel,
  transformInquiryMessagesToViewModels,
  transformInquiryThreadToViewModel,
  transformRealtimeConsultationMessages,
} from "./transform-inquiry";

import type {
  BuyerInquiry,
  BuyerInquiryDetail,
  InquiryMessage,
  InquiryThread,
} from "../model/schema";

function message(overrides: Partial<InquiryMessage> = {}): InquiryMessage {
  return {
    messageIdx: 1,
    threadIdx: 101,
    body: "문의드립니다.",
    userIdx: 5971,
    attachmentIdx: null,
    writeTime: "2026-10-01T10:00:00",
    readTime: null,
    modifyTime: null,
    deleteTime: null,
    identifier: "advertiser01",
    isUserMessage: true,
    fileName: null,
    fileSize: null,
    fileType: null,
    auto: false,
    ...overrides,
  };
}

function thread(overrides: Partial<InquiryThread> = {}): InquiryThread {
  return {
    threadIdx: 101,
    sequence: 7,
    viewing: "client",
    toUserIdx: 1,
    fmUserIdx: 5971,
    campaignIdx: 10,
    finishTime: null,
    created: "2026-10-01T10:00:00",
    messages: [],
    boardType: true,
    status: "WAITING",
    ...overrides,
  };
}

describe("transformRealtimeConsultationMessages", () => {
  it("Firestore 실시간 상담의 메시지와 날짜를 대화에 표시할 형태로 바꾼다", () => {
    const consultation = realtimeConsultationSchema.parse({
      sequence: 7,
      threadIdx: 101,
      isConnect: true,
      finishTime: null,
      messages: [
        {
          auto: false,
          attachmentIdx: null,
          identifier: "advertiser01",
          isUserMessage: true,
          body: "상담 문의입니다.",
          fileName: null,
          created: "2026-10-01 10:00:00",
        },
        {
          auto: false,
          attachmentIdx: null,
          identifier: "admin",
          isUserMessage: false,
          body: "안녕하세요.</br>확인하겠습니다.",
          fileName: null,
          fileType: null,
          created: "2026-10-01 10:01:00",
        },
      ],
    });
    const messages = transformRealtimeConsultationMessages(consultation);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      isMine: true,
      kind: "text",
      body: "상담 문의입니다.",
    });
    expect(messages[0]?.createdAt).toEqual(new Date("2026-10-01T10:00:00"));
    expect(messages[1]).toMatchObject({
      isMine: false,
      body: "안녕하세요.\n확인하겠습니다.",
    });
  });
});

const CAMPAIGN_CARD = JSON.stringify({
  mainImageUrl: null,
  campaignCode: "P-1",
  brandName: "빅버드",
  productName: "샘플 상품",
});

describe("inquiryThreadListSchema", () => {
  it("REST Docs 15.2 예시 응답을 통과시킨다", () => {
    const response = {
      result: true,
      data: [thread({ messages: [message()] })],
    };
    expect(inquiryThreadListSchema.parse(response)).toEqual(response);
  });

  it("nullable이 아닌 필드가 null이면 거부한다", () => {
    const response = {
      result: true,
      data: [thread({ messages: [message({ body: null as never })] })],
    };
    expect(inquiryThreadListSchema.safeParse(response).success).toBe(false);
  });
});

describe("transformInquiryThreadToViewModel", () => {
  it.each([
    ["WAITING", "waiting"],
    ["IN_PROGRESS", "consulting"],
    ["ANSWERED", "done"],
  ] as const)("서버 상태 %s → %s", (serverStatus, status) => {
    const viewModel = transformInquiryThreadToViewModel(
      thread({
        status: serverStatus,
        messages: [message({ isUserMessage: false })],
      }),
    );
    expect(viewModel.status).toBe(status);
    expect(viewModel.isFinished).toBe(false);
  });

  it("완료 시각과 서버의 표시 상태를 각각 유지한다", () => {
    const viewModel = transformInquiryThreadToViewModel(
      thread({
        status: "ANSWERED",
        finishTime: "2026-10-02T10:00:00",
      }),
    );
    expect(viewModel.status).toBe("done");
    expect(viewModel.isFinished).toBe(true);
  });

  it("메시지 목록이 null이면 빈 대화로 본다", () => {
    const viewModel = transformInquiryThreadToViewModel(
      thread({ messages: null }),
    );
    expect(viewModel.messages).toEqual([]);
    expect(viewModel.status).toBe("waiting");
  });

  it("메시지 종류를 구분한다", () => {
    const { messages } = transformInquiryThreadToViewModel(
      thread({
        messages: [
          message({ messageIdx: 1, auto: true, body: CAMPAIGN_CARD }),
          message({ messageIdx: 2, auto: true, body: "안녕하세요" }),
          message({ messageIdx: 3, auto: true, body: "{깨진 JSON" }),
          message({ messageIdx: 4 }),
          message({ messageIdx: 5, attachmentIdx: 9, fileType: "image/png" }),
          message({ messageIdx: 6, attachmentIdx: 9, fileType: "video/mp4" }),
          message({
            messageIdx: 7,
            attachmentIdx: 9,
            fileType: "application/pdf",
          }),
          // 문서는 image 경로로 올라가 fileType이 image여도 파일 이름으로 문서로 봄
          message({
            messageIdx: 8,
            attachmentIdx: 9,
            fileType: "image",
            fileName: "보고서.xlsx",
          }),
          // 인플루언서 문의는 fileType이 비어 와서 파일 이름 확장자로 사진·동영상을 가림
          message({
            messageIdx: 9,
            attachmentIdx: 9,
            fileType: null,
            fileName: "PNG.png",
          }),
          message({
            messageIdx: 10,
            attachmentIdx: 9,
            fileType: null,
            fileName: "영상.MOV",
          }),
          message({
            messageIdx: 11,
            attachmentIdx: 9,
            fileType: null,
            fileName: "자료.zip",
          }),
        ],
      }),
    );
    expect(messages.map((item) => item.kind)).toEqual([
      "campaignCard",
      "system",
      "system",
      "text",
      "image",
      "video",
      "file",
      "file",
      "image",
      "video",
      "file",
    ]);
    expect(messages[0]?.campaign?.productName).toBe("샘플 상품");
  });

  it("본문의 br 태그를 줄바꿈으로 바꾼다", () => {
    const { messages } = transformInquiryThreadToViewModel(
      thread({
        messages: [
          message({
            auto: true,
            body: "안녕하세요 :D </br>문의하실 내용을 남겨주세요.",
          }),
        ],
      }),
    );
    expect(messages[0]?.body).toBe(
      "안녕하세요 :D \n문의하실 내용을 남겨주세요.",
    );
  });

  it("연속된 같은 auto 메시지는 하나만 남긴다", () => {
    const { messages } = transformInquiryThreadToViewModel(
      thread({
        messages: [
          message({
            messageIdx: 1,
            auto: true,
            body: "상담이 종료되었습니다.",
          }),
          message({
            messageIdx: 2,
            auto: true,
            body: "상담이 종료되었습니다.",
          }),
          message({ messageIdx: 3 }),
          message({
            messageIdx: 4,
            auto: true,
            body: "상담이 종료되었습니다.",
          }),
        ],
      }),
    );
    expect(messages.map((item) => item.id)).toEqual([1, 3, 4]);
  });
});

describe("transformInquiryCampaignToViewModel", () => {
  it("v2 표기로 캠페인 이름을 만든다", () => {
    expect(
      transformInquiryCampaignToViewModel({
        campaignIdx: 10,
        campaignCode: "P-1",
        brandName: "빅버드",
        productName: "샘플 상품",
        mainImageUrl: null,
        progressStartDate: "2026-10-01",
        progressEndDate: "2026-10-31",
      }).name,
    ).toBe("빅버드 샘플 상품");
  });
});

describe("transformInquiryCampaignToViewModel: 캠페인 유형", () => {
  const base = {
    campaignIdx: 1,
    campaignCode: "C1",
    brandName: "브랜드",
    productName: "상품",
    mainImageUrl: null,
    progressStartDate: null,
    progressEndDate: null,
  };

  it("서버가 준 유형 표시명을 그대로 담고, 없으면 null이다", () => {
    expect(
      transformInquiryCampaignToViewModel({
        ...base,
        campaignServiceName: "베이직형",
      }).typeName,
    ).toBe("베이직형");
    expect(transformInquiryCampaignToViewModel(base).typeName).toBeNull();
  });
});

describe("transformInquiryCampaignToViewModel: 진행기간", () => {
  const campaign = (start: string | null, end: string | null) =>
    transformInquiryCampaignToViewModel({
      campaignIdx: 10,
      campaignCode: "P-1",
      brandName: "빅버드",
      productName: "샘플 상품",
      mainImageUrl: null,
      progressStartDate: start,
      progressEndDate: end,
    });

  it("시안 표기 yyyy.MM.dd ~ yyyy.MM.dd로 바꾼다", () => {
    expect(campaign("2026-10-01", "2026-10-31").period).toBe(
      "2026.10.01 ~ 2026.10.31",
    );
  });

  it("시작일이나 종료일이 없으면 기간을 만들지 않는다", () => {
    expect(campaign(null, "2026-10-31").period).toBeNull();
    expect(campaign("2026-10-01", null).period).toBeNull();
  });
});

describe("toCampaignCardBody", () => {
  it("운영 앱과 이 화면이 읽는 캠페인 카드 JSON을 만든다", () => {
    const campaign = transformInquiryCampaignToViewModel({
      campaignIdx: 10,
      campaignCode: "P-1",
      brandName: "빅버드",
      productName: "샘플 상품",
      mainImageUrl: "https://img/1.jpg",
      progressStartDate: "2026-10-01",
      progressEndDate: "2026-10-31",
    });
    const { messages } = transformInquiryThreadToViewModel(
      thread({
        messages: [message({ auto: true, body: toCampaignCardBody(campaign) })],
      }),
    );
    expect(messages[0]?.campaign).toEqual({
      mainImageUrl: "https://img/1.jpg",
      campaignCode: "P-1",
      brandName: "빅버드",
      productName: "샘플 상품",
    });
  });
});

describe("transformInquiryThreadToViewModel: 캠페인 카드", () => {
  const card = toCampaignCardBody(
    transformInquiryCampaignToViewModel({
      campaignIdx: 10,
      campaignCode: "P-1",
      brandName: "빅버드",
      productName: "샘플 상품",
      mainImageUrl: null,
      progressStartDate: "2026-10-01",
      progressEndDate: "2026-10-31",
    }),
  );

  it("v2 호환으로 isUserMessage가 false인 카드도 내가 보낸 메시지로 그린다", () => {
    const { messages } = transformInquiryThreadToViewModel(
      thread({
        messages: [
          message({ auto: true, isUserMessage: false, body: card }),
          message({
            messageIdx: 2,
            isUserMessage: false,
            body: "운영자 답변",
          }),
        ],
      }),
    );
    expect(messages[0]).toMatchObject({ kind: "campaignCard", isMine: true });
    expect(messages[1]).toMatchObject({ kind: "text", isMine: false });
  });
});

describe("transformRealtimeConsultationMessages: 캠페인 카드", () => {
  it("v2 호환으로 isUserMessage가 false인 카드도 내가 보낸 메시지로 그린다", () => {
    const card = JSON.stringify({
      mainImageUrl: null,
      campaignCode: "L-1",
      brandName: "브랜드",
      productName: "상품",
    });
    const consultation = realtimeConsultationSchema.parse({
      sequence: 7,
      threadIdx: 101,
      isConnect: false,
      finishTime: null,
      messages: [
        {
          auto: true,
          attachmentIdx: null,
          identifier: null,
          isUserMessage: false,
          body: card,
          created: "2026-10-19 16:26:00",
        },
        {
          auto: false,
          attachmentIdx: null,
          identifier: "op",
          isUserMessage: false,
          body: "운영자 답변",
          created: "2026-10-19 16:27:00",
        },
      ],
    });
    const [cardMessage, reply] =
      transformRealtimeConsultationMessages(consultation);
    expect(cardMessage).toMatchObject({ kind: "campaignCard", isMine: true });
    expect(reply).toMatchObject({ kind: "text", isMine: false });
  });
});

describe("transformBuyerInquiryToViewModel", () => {
  const buyer = (overrides: Partial<BuyerInquiry> = {}): BuyerInquiry => ({
    inquiryIdx: 501,
    sourceType: "PURCHASER_QUESTION",
    status: "WAITING",
    campaignIdx: 10,
    orderNumber: "20261001-0001",
    writerName: "김하루",
    body: "배송이 언제 되나요?",
    writeTime: "2026-10-01 10:00",
    threadUserIdx: 77,
    hasUnread: false,
    userIdx: null,
    ...overrides,
  });

  it("출처를 담은 임시 키와 미리보기·시각을 만든다", () => {
    const view = transformBuyerInquiryToViewModel(buyer());
    expect(view).toMatchObject({
      key: "purchaser-501",
      source: "purchaser",
      status: "waiting",
      preview: "배송이 언제 되나요?",
    });
    expect(view.lastActivityAt).toEqual(new Date("2026-10-01T10:00"));
  });

  it("답변 상태이면 완료로 보고, 조회 키(threadUserIdx·userIdx)를 그대로 싣는다", () => {
    const view = transformBuyerInquiryToViewModel(
      buyer({ status: "ANSWERED" }),
    );
    expect(view).toMatchObject({
      status: "done",
      threadUserIdx: 77,
      userIdx: null,
    });
    expect(
      transformBuyerInquiryToViewModel(buyer({ status: "IN_PROGRESS" })).status,
    ).toBe("consulting");
    const qna = transformBuyerInquiryToViewModel(
      buyer({ sourceType: "PRODUCT_QNA", threadUserIdx: null, userIdx: 9 }),
    );
    expect(qna).toMatchObject({
      key: "qna-501",
      threadUserIdx: null,
      userIdx: 9,
    });
  });

  it("메시지가 없는 스레드(null 필드)도 다룬다", () => {
    const view = transformBuyerInquiryToViewModel(
      buyer({
        sourceType: "PRODUCT_QNA",
        writerName: null,
        body: null,
        writeTime: null,
      }),
    );
    expect(view).toMatchObject({
      key: "qna-501",
      writerName: null,
      preview: "",
      lastActivityAt: null,
    });
  });
});

describe("transformBuyerInquiryDetailToViewModel: 대표 이미지·상품명·인플루언서 닉네임", () => {
  const detail = (link: string | null): BuyerInquiryDetail => ({
    result: true,
    writerName: null,
    email: null,
    phoneNumber: null,
    orderNumber: null,
    orderDate: null,
    paymentAmount: null,
    campaignType: null,
    campaignCode: null,
    shopCode: null,
    progressStatus: null,
    progressStartDate: null,
    progressEndDate: null,
    influencerPlatform: null,
    influencerAccountLink: link,
    mainImageUrl: null,
    brandName: null,
    productName: null,
  });

  it('대표 이미지와 "브랜드 상품명"을 상세 응답에서 가져온다', () => {
    const viewModel = transformBuyerInquiryDetailToViewModel({
      ...detail(null),
      mainImageUrl: "https://cdn/shop.png",
      brandName: "빅버드",
      productName: "스킨케어 세트",
    });
    expect(viewModel.imageUrl).toBe("https://cdn/shop.png");
    expect(viewModel.name).toBe("빅버드 스킨케어 세트");
    expect(
      transformBuyerInquiryDetailToViewModel({
        ...detail(null),
        productName: "스킨케어 세트",
      }).name,
    ).toBe("스킨케어 세트");
    expect(
      transformBuyerInquiryDetailToViewModel(detail(null)).name,
    ).toBeNull();
  });

  it("인플루언서 닉네임을 그대로 쓰고 비면 null", () => {
    expect(
      transformBuyerInquiryDetailToViewModel({
        ...detail(null),
        influencerNickname: "gang33431",
      }).influencerNickname,
    ).toBe("gang33431");
    expect(
      transformBuyerInquiryDetailToViewModel(detail(null)).influencerNickname,
    ).toBeNull();
  });
});

describe("transformInquiryThreadToViewModel: v2가 저장한 링크·줄바꿈 HTML", () => {
  const bodyOf = (body: string) =>
    transformInquiryThreadToViewModel(thread({ messages: [message({ body })] }))
      .messages[0]?.body;

  it("URL·이메일을 감싼 <a> 태그는 벗기고 사용자가 입력한 원문만 남긴다", () => {
    expect(
      bodyOf(
        '확인 <a class="autoLink" href="https://x.com/a?b=1&c=2" target="_blank">https://x.com/a?b=1&c=2</a> 부탁',
      ),
    ).toBe("확인 https://x.com/a?b=1&c=2 부탁");
    expect(
      bodyOf(
        '<a class="autoLink" href="http://www.bigbird.co.kr" target="_blank">www.bigbird.co.kr</a>',
      ),
    ).toBe("www.bigbird.co.kr");
    expect(
      bodyOf('메일 <a class="autoLink" href="mailto:a@b.co">a@b.co</a>'),
    ).toBe("메일 a@b.co");
  });

  it("링크가 여러 개이고 줄바꿈이 섞여도 모두 텍스트로 바꾼다", () => {
    expect(
      bodyOf(
        '<a class="autoLink" href="https://a.kr">https://a.kr</a></br><a class="autoLink" href="https://b.kr">https://b.kr</a>',
      ),
    ).toBe("https://a.kr\nhttps://b.kr");
  });

  it("링크가 없는 본문은 그대로 둔다", () => {
    expect(bodyOf("a < b 이고 c > d 입니다")).toBe("a < b 이고 c > d 입니다");
  });
});

describe("buildSubmittedInquiryViewModel", () => {
  const campaign = transformInquiryCampaignToViewModel({
    campaignIdx: 10,
    campaignCode: "C10",
    brandName: "브랜드",
    productName: "상품",
    mainImageUrl: null,
    progressStartDate: null,
    progressEndDate: null,
  });

  it("캠페인 카드와 본문을 담은 답변 대기 일반 문의를 만든다", () => {
    const inquiry = buildSubmittedInquiryViewModel({
      threadIdx: 5,
      campaign,
      body: "문의드립니다",
    });
    expect(inquiry).toMatchObject({
      threadIdx: 5,
      campaignIdx: 10,
      isRealtime: false,
      status: "waiting",
    });
    expect(inquiry.messages.map((message) => message.kind)).toEqual([
      "campaignCard",
      "text",
    ]);
    expect(inquiry.messages.every((message) => message.id < 0)).toBe(true);
  });

  it("기타 문의에 본문이 비어 있으면 메시지가 없다", () => {
    const inquiry = buildSubmittedInquiryViewModel({
      threadIdx: 6,
      campaign: null,
      body: "  ",
    });
    expect(inquiry.messages).toEqual([]);
  });
});

describe("transformInquiryMessagesToViewModels", () => {
  it("실시간 구간 메시지의 null 값은 음수 id와 앞 메시지 시각으로 채운다", () => {
    const result = transformInquiryMessagesToViewModels([
      message({ messageIdx: 5, writeTime: "2026-10-01T10:00:00" }),
      message({ messageIdx: null, userIdx: null, writeTime: null }),
      message({ messageIdx: 6, writeTime: "2026-10-01T11:00:00" }),
    ]);

    expect(result.map((item) => item.id)).toEqual([5, -2, 6]);
    expect(result.map((item) => item.createdAt)).toEqual([
      new Date("2026-10-01T10:00:00"),
      new Date("2026-10-01T10:00:00"),
      new Date("2026-10-01T11:00:00"),
    ]);
  });

  it("첫 메시지의 시각이 null이면 뒤에서 처음 나오는 시각을 쓴다", () => {
    const result = transformInquiryMessagesToViewModels([
      message({ messageIdx: null, writeTime: null }),
      message({ messageIdx: 6, writeTime: "2026-10-01T11:00:00" }),
    ]);

    expect(result.map((item) => item.createdAt)).toEqual([
      new Date("2026-10-01T11:00:00"),
      new Date("2026-10-01T11:00:00"),
    ]);
  });
});

describe("자동 메시지 분류", () => {
  it("상담 종료 안내(세 문구)는 구분선(notice)으로 보이고 다른 자동 안내는 시스템 메시지로 숨긴다", () => {
    const bodies = [
      "실시간 상담이 종료되었습니다.",
      "상담이 종료되었습니다.",
      "추가 문의가 없으셔서 실시간 상담이 자동종료되었습니다.",
      "상담원과 연결되었습니다.",
      "실시간 상담을 요청했습니다.",
    ];
    const kinds = transformInquiryMessagesToViewModels(
      bodies.map((body, index) =>
        message({
          messageIdx: index + 1,
          auto: true,
          isUserMessage: false,
          body,
        }),
      ),
    ).map((view) => view.kind);

    expect(kinds).toEqual(["notice", "notice", "notice", "system", "system"]);
  });

  it("사람이 쓴 같은 문구는 안내가 아니라 일반 메시지로 둔다", () => {
    const [view] = transformInquiryMessagesToViewModels([
      message({ messageIdx: 1, body: "상담이 종료되었습니다." }),
    ]);
    expect(view?.kind).toBe("text");
  });
});

describe("transformInquiryCampaignDetailToViewModel", () => {
  it("빈 값은 null로 두고 기간은 시안 표기로 합친다", () => {
    expect(
      transformInquiryCampaignDetailToViewModel({
        result: true,
        mainImageUrl: "",
        campaignType: "PICK형",
        progressStatus: "구매중",
        progressStartDate: "2026-10-01",
        progressEndDate: "2026-10-31",
        shopCode: null,
      }),
    ).toEqual({
      imageUrl: null,
      typeName: "PICK형",
      progressStatus: "구매중",
      period: "2026.10.01 ~ 2026.10.31",
      shopCode: null,
    });
  });

  it("기간 중 하나라도 없으면 기간은 null", () => {
    expect(
      transformInquiryCampaignDetailToViewModel({
        result: true,
        progressStartDate: "2026-10-01",
        progressEndDate: null,
      }).period,
    ).toBeNull();
  });
});

describe("transformBigbirdInquiryDetailMessages", () => {
  it("메시지가 null이면 빈 대화, 연속된 같은 자동 안내는 하나만 남긴다", () => {
    expect(transformBigbirdInquiryDetailMessages(null)).toEqual([]);
    const notice = { auto: true, body: "상담이 종료되었습니다." };
    const views = transformBigbirdInquiryDetailMessages([
      message({ messageIdx: 1, ...notice }),
      message({ messageIdx: 2, ...notice }),
      message({ messageIdx: 3, body: "다시 문의합니다." }),
    ]);
    expect(views.map((view) => view.id)).toEqual([1, 3]);
  });
});
