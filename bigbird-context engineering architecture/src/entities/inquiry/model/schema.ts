import { z } from "zod";

// V3 고객센터(`/v3/help/**`) 응답. Swagger의 required·nullable 표시를 그대로 따름
// (백엔드 재판정 반영, 2026-10-16).

/** `GET /v3/help/thread`의 메시지. */
export const inquiryMessageSchema = z.object({
  messageIdx: z.number(),
  threadIdx: z.number(),
  body: z.string(),
  userIdx: z.number(),
  attachmentIdx: z.number().nullable(),
  writeTime: z.string(),
  readTime: z.string().nullable(),
  modifyTime: z.string().nullable(),
  deleteTime: z.string().nullable(),
  /** 작성자 계정 id. 알 수 없는 레거시 계정이면 빈 문자열. */
  identifier: z.string(),
  /** 광고주 쪽에서 보낸 메시지인지 여부. */
  isUserMessage: z.boolean(),
  fileName: z.string().nullable(),
  fileSize: z.number().nullable(),
  fileType: z.string().nullable(),
  auto: z.boolean(),
});
export type InquiryMessage = z.infer<typeof inquiryMessageSchema>;

/** `GET /v3/help/thread`의 스레드. 스레드 하나가 문의 1건. */
export const inquiryThreadSchema = z.object({
  threadIdx: z.number(),
  sequence: z.number(),
  viewing: z.string().nullable(),
  toUserIdx: z.number(),
  fmUserIdx: z.number(),
  campaignIdx: z.number().nullable(),
  /** null이면 진행 중. */
  finishTime: z.string().nullable(),
  created: z.string(),
  /** 서버에 메시지 목록이 없으면 null. */
  messages: z.array(inquiryMessageSchema).nullable(),
  /** true면 문의 남기기(게시판형), false면 실시간 상담. */
  boardType: z.boolean(),
  /** 서버가 계산한 답변 대기·상담 중·답변 완료 상태. */
  status: z.enum(["WAITING", "IN_PROGRESS", "ANSWERED"]),
});
export type InquiryThread = z.infer<typeof inquiryThreadSchema>;

export const inquiryThreadListSchema = z.object({
  result: z.boolean(),
  data: z.array(inquiryThreadSchema),
});

/** `GET /v3/help/c-client-campaign`의 항목. */
export const inquiryCampaignSchema = z.object({
  campaignIdx: z.number(),
  campaignCode: z.string(),
  brandName: z.string(),
  productName: z.string(),
  mainImageUrl: z.string().nullable(),
  /** 진행기간(`yyyy-MM-dd`). 값이 없을 수 있음(Swagger required + nullable). */
  progressStartDate: z.string().nullable(),
  progressEndDate: z.string().nullable(),
});
export type InquiryCampaign = z.infer<typeof inquiryCampaignSchema>;

export const inquiryCampaignListSchema = z.object({
  result: z.boolean(),
  list: z.array(inquiryCampaignSchema),
});

/** `POST /v3/help/thread` */
export const createInquiryThreadResultSchema = z.object({
  result: z.boolean(),
  data: z.object({ sequence: z.number(), threadIdx: z.number() }),
});

/**
 * `POST /v3/help/thread/message`. 요청한 스레드가 이미 종료됐으면 서버가 새 스레드를
 * 만들고 그 `threadIdx`를 돌려줌.
 */
export const sendInquiryMessageResultSchema = z.object({
  result: z.boolean(),
  threadIdx: z.number(),
});

/** `POST /v3/help/message/{type}/{service}`(첨부 업로드) 응답. 스펙 기록 기준이며 Swagger의 required·nullable은 확인 전. */
export const uploadInquiryAttachmentResultSchema = z.object({
  result: z.boolean(),
  url: z.string(),
  attachmentIdx: z.number(),
  fileName: z.string(),
  fileSize: z.number(),
});

/** `PUT /v3/help/thread/{threadIdx}` 등 결과만 주는 응답. */
export const simpleResultSchema = z.object({ result: z.boolean() });

/**
 * 문의 생성 직후 보내는 auto 메시지의 캠페인 카드 본문(JSON 문자열).
 * 운영 앱이 `JSON.parse`해서 그리므로 이 네 필드는 형식을 지켜야 함.
 */
export const campaignCardSchema = z.object({
  mainImageUrl: z.string().nullable(),
  campaignCode: z.string(),
  brandName: z.string(),
  productName: z.string(),
});
export type CampaignCard = z.infer<typeof campaignCardSchema>;

/** 기존 헬프데스크 Firestore `sequence/{sequence}`의 실시간 상담 메시지. */
export const realtimeConsultationSchema = z.object({
  sequence: z.number(),
  threadIdx: z.number(),
  isConnect: z.boolean(),
  finishTime: z.string().nullable(),
  // 다른 앱이 읽는 기존 필드. 요청 시각 판단에는 REST의 created를 쓰고 여기서는 읽기만 함.
  seqResponseDate: z.string().nullish(),
  // 실시간 상담 상태 계약(specs/customer-center/customer-center.md)의 추가 필드. 없는 과거 문서도 읽을 수 있어야 함.
  origin: z.enum(["v2", "v3"]).nullish(),
  waitDeadline: z.string().nullish(),
  canceledAt: z.string().nullish(),
  expiredAt: z.string().nullish(),
  closingAt: z.string().nullish(),
  messages: z.array(
    z.object({
      auto: z.boolean(),
      attachmentIdx: z.number().nullable(),
      identifier: z.string().nullable(),
      isUserMessage: z.boolean(),
      body: z.string(),
      fileName: z.string().nullish(),
      /** v2의 텍스트·auto 메시지는 이 필드를 쓰지 않음. */
      fileType: z.string().nullish(),
      created: z.string(),
      /** 재시도 중복 방지용 식별자. 과거 메시지에는 없음. */
      messageId: z.string().nullish(),
    }),
  ),
});
export type RealtimeConsultation = z.infer<typeof realtimeConsultationSchema>;

/**
 * 목록·헤더에 보이는 표시 상태(답변 대기 / 상담 중 / 답변 완료 / 요청 실패).
 * 상담 중·요청 실패는 실시간 상담에서만 나옴. 요청 실패의 상태 탭 분류는 미정이라 전체 탭에서만 보임.
 */
export type BigbirdInquiryStatus = "waiting" | "consulting" | "done" | "failed";

/** 실시간 상담의 진행 단계. 표시 상태와 별개로 대화 위 안내 카드를 정함. */
export type RealtimePhase = "requesting" | "connected" | "failed" | "finished";

export type InquiryMessageKind =
  "text" | "campaignCard" | "image" | "video" | "file" | "system";

export interface InquiryAttachment {
  attachmentIdx: number;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
}

export interface InquiryMessageViewModel {
  id: number;
  /** 광고주(나)가 보낸 메시지. */
  isMine: boolean;
  kind: InquiryMessageKind;
  /** 일반 텍스트. HTML로 렌더하지 않음. */
  body: string;
  createdAt: Date;
  isDeleted: boolean;
  campaign: CampaignCard | null;
  attachment: InquiryAttachment | null;
}

export interface BigbirdInquiryViewModel {
  threadIdx: number;
  sequence: number;
  campaignIdx: number | null;
  isRealtime: boolean;
  isFinished: boolean;
  status: BigbirdInquiryStatus;
  /** 실시간 상담의 단계. 일반 문의이거나 Firestore 상태를 아직 모르면 null. */
  realtimePhase: RealtimePhase | null;
  /** 연결 대기가 끝나는 시각(ms). Firestore 상태를 받은 실시간 상담만 있음. */
  connectDeadlineAt?: number;
  /** 연결된 상담이 무응답으로 종료되는 시각(ms). 광고주가 말했거나 연결 전이면 null. */
  idleDeadlineAt?: number | null;
  /** 요청 실패한 상담을 같은 문의로 다시 요청할 수 있는지(취소된 요청은 불가). */
  isRetryable?: boolean;
  createdAt: Date;
  messages: InquiryMessageViewModel[];
}

export interface InquiryCampaignViewModel {
  campaignIdx: number;
  campaignCode: string;
  brandName: string;
  productName: string;
  /** v2 표기 `[브랜드명]상품명` */
  name: string;
  imageUrl: string | null;
  /** 진행기간 표시 `yyyy.MM.dd ~ yyyy.MM.dd`(Figma). 기간이 없으면 null. */
  period: string | null;
}

/** `GET /v3/help/inquiry` 항목: 구매자 문의와 상품 Q&A 통합 목록. 시각은 "2026-10-01 10:00" 형식. */
export const buyerInquirySchema = z.object({
  inquiryIdx: z.number(),
  sourceType: z.enum(["PURCHASER_QUESTION", "PRODUCT_QNA"]),
  status: z.enum(["WAITING", "ANSWERED"]),
  campaignIdx: z.number().nullable(),
  orderNumber: z.string().nullable(),
  writerName: z.string().nullable(),
  /** 가장 최근 메시지(상품 Q&A는 질문) 본문. 메시지가 없는 스레드면 null. */
  body: z.string().nullable(),
  writeTime: z.string().nullable(),
  /** 구매자 문의 대화 조회 키(`GET /v3/help/thread`의 threadUserIdx). 상품 Q&A면 null. */
  threadUserIdx: z.number().nullable(),
  /** 상품 Q&A 상세 조회 키(`POST /v3/help/qna`의 userIdx). 구매자 문의면 null. */
  userIdx: z.number().nullable(),
});
export type BuyerInquiry = z.infer<typeof buyerInquirySchema>;

export const buyerInquiryListSchema = z.object({
  result: z.boolean(),
  list: z.array(buyerInquirySchema),
  pagingInfo: z.object({
    page: z.number(),
    size: z.number(),
    totalCount: z.number(),
    totalPage: z.number(),
  }),
});

export const buyerInfluencerOptionsSchema = z.object({
  result: z.boolean(),
  list: z.array(
    z.object({ threadUserIdx: z.number(), displayName: z.string() }),
  ),
});

/**
 * `GET /v3/help/c-purchaser-questionInfo/{orderNumber}` 주문번호 기준 주문/상품 정보(단일 객체). 상세 패널의 상품 썸네일·이름에 씀.
 * `mainImageUrl`·`deliveryStatus`·`campaignServiceName`만 null일 수 있음(Swagger).
 */
export const purchaserQuestionInfoSchema = z.object({
  result: z.boolean(),
  list: z.object({
    orderNumber: z.string(),
    orderState: z.string(),
    newOrderState: z.string(),
    deliveryStatus: z.string().nullable(),
    mainImageUrl: z.string().nullable(),
    shopCode: z.string(),
    campaignCode: z.string(),
    campaignServiceName: z.string().nullable(),
    brandName: z.string(),
    productName: z.string(),
  }),
});
export type PurchaserQuestionInfo = z.infer<
  typeof purchaserQuestionInfoSchema
>["list"];

/**
 * `GET /v3/help/user/{threadUserIdx}` 문의 요청 유저 정보. 비회원·운영 스레드면 `id`·`profileImage`가 null이고,
 * 운영이면 `nickname`이 "bigbird"(Swagger). 화면은 프로필 이미지만 씀.
 */
export const inquiryUserSchema = z.object({
  result: z.boolean(),
  data: z.object({
    nickname: z.string().nullable(),
    id: z.string().nullable(),
    profileImage: z.string().nullable(),
  }),
});

/** 구매자 상세 패널의 상품(주문번호 기준). */
export interface BuyerProductViewModel {
  /** v2 표기 `[브랜드명]상품명` */
  name: string;
  imageUrl: string | null;
}

/**
 * `GET /v3/help/inquiry/{inquiryIdx}` 상세 패널. 값이 없는 필드도 키는 오고 null(Swagger required + nullable).
 * 날짜 형식은 명세에 없어 문자열 그대로 둠.
 */
export const buyerInquiryDetailSchema = z.object({
  result: z.boolean(),
  writerName: z.string().nullable(),
  email: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  /** 상품 Q&A는 특정 주문에 묶이지 않아 항상 null. */
  orderNumber: z.string().nullable(),
  orderDate: z.string().nullable(),
  paymentAmount: z.number().nullable(),
  campaignType: z.string().nullable(),
  campaignCode: z.string().nullable(),
  shopCode: z.string().nullable(),
  progressStatus: z.string().nullable(),
  progressStartDate: z.string().nullable(),
  progressEndDate: z.string().nullable(),
  influencerPlatform: z.string().nullable(),
  influencerAccountLink: z.string().nullable(),
});
export type BuyerInquiryDetail = z.infer<typeof buyerInquiryDetailSchema>;

/**
 * `POST /v3/help/qna` 상품 Q&A 상세. 시각은 "yyyy-MM-dd HH:mm" 문자열이고, 답변이 없으면 `replyInfo`가 `{}`라
 * 필드를 모두 선택으로 읽음.
 */
export const qnaDetailListSchema = z.object({
  result: z.boolean(),
  list: z.array(
    z.object({
      campaignInfo: z.object({
        productName: z.string().nullable(),
        mainImageUrl: z.string().nullable(),
        optionName: z.string().nullable(),
      }),
      inquiryInfo: z.object({
        inquiryIdx: z.number(),
        body: z.string(),
        writeTime: z.string(),
        modifyTime: z.string().nullable(),
        inquiryType: z.string().nullable(),
        deleteTime: z.string().nullable(),
        deleteId: z.string().nullable(),
      }),
      replyInfo: z.object({
        replyIdx: z.number().nullish(),
        body: z.string().nullish(),
        readTime: z.string().nullish(),
        writeTime: z.string().nullish(),
        modifyTime: z.string().nullish(),
        clientId: z.string().nullish(),
        deleteTime: z.string().nullish(),
        deleteId: z.string().nullish(),
      }),
    }),
  ),
});
export type QnaDetailList = z.infer<typeof qnaDetailListSchema>;

/** `POST /v3/help/reply` 응답. 실패는 HTTP 상태 코드(404 문의 없음, 409 이미 답변)로 옴. */
export const replyResultSchema = z.object({
  result: z.boolean(),
  status: z.string(),
});

export type BuyerInquirySource = "purchaser" | "qna";
export type BuyerInquiryStatus = "waiting" | "done";

export interface BuyerInquiryViewModel {
  /** URL용 임시 키 `{출처}-{inquiryIdx}`. 상세 조회 키가 확정되면 바꿈. */
  key: string;
  inquiryIdx: number;
  source: BuyerInquirySource;
  status: BuyerInquiryStatus;
  campaignIdx: number | null;
  orderNumber: string | null;
  writerName: string | null;
  body: string | null;
  writeTime: Date | null;
  /** 구매자 문의 대화 조회 키. 상품 Q&A면 null. */
  threadUserIdx: number | null;
  /** 상품 Q&A 상세 조회 키. 구매자 문의면 null. */
  userIdx: number | null;
  /** 목록 미리보기: 가장 최근 메시지 본문. */
  preview: string;
  /** 마지막 활동 시각. 메시지가 없는 스레드는 null. */
  lastActivityAt: Date | null;
}

export interface BuyerInquiryDetailViewModel {
  writerName: string | null;
  email: string | null;
  phoneNumber: string | null;
  orderNumber: string | null;
  orderDate: string | null;
  paymentAmount: number | null;
  campaignType: string | null;
  campaignCode: string | null;
  shopCode: string | null;
  progressStatus: string | null;
  progressStartDate: string | null;
  progressEndDate: string | null;
  influencerPlatform: string | null;
  influencerAccountLink: string | null;
}

/** 상품 Q&A 한 건: 질문과 광고주 답변(없으면 null). */
export interface QnaItemViewModel {
  inquiryIdx: number;
  productName: string | null;
  productImageUrl: string | null;
  optionName: string | null;
  inquiryType: string | null;
  question: { body: string; writtenAt: Date; isDeleted: boolean };
  reply: {
    replyIdx: number;
    body: string;
    writtenAt: Date | null;
    /** 구매자가 읽은 답변은 서버가 수정·삭제를 거절함(409). */
    isRead: boolean;
  } | null;
}
