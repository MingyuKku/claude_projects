import { describe, expect, it } from "vitest";

import {
  inquiryThreadListSchema,
  realtimeConsultationSchema,
} from "../model/schema";
import {
  buildSubmittedInquiryViewModel,
  toCampaignCardBody,
  transformBuyerInquiryDetailToViewModel,
  transformBuyerInquiryToViewModel,
  transformInquiryCampaignToViewModel,
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
    ).toBe("[빅버드]샘플 상품");
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

describe("transformBuyerInquiryDetailToViewModel: 인플루언서 링크", () => {
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
  });

  it("http(s) 링크만 그대로 둔다", () => {
    expect(
      transformBuyerInquiryDetailToViewModel(
        detail("https://www.instagram.com/bigbird"),
      ).influencerAccountLink,
    ).toBe("https://www.instagram.com/bigbird");
  });

  it.each(["javascript:alert(1)", "data:text/html,x", "bigbird", ""])(
    "다른 스킴이나 깨진 값(%s)은 null로 바꾼다",
    (link) => {
      expect(
        transformBuyerInquiryDetailToViewModel(detail(link))
          .influencerAccountLink,
      ).toBeNull();
    },
  );
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
