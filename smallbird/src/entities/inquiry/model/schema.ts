import { z } from "zod";

import { normalizeFirestoreTime } from "./firestore-time";

// V3 고객센터(`/v3/help/**`) 응답. Swagger의 required·nullable 표시를 그대로 따름
// (백엔드 재판정 반영, 2026-10-16).

/**
 * `GET /v3/help/thread`·`GET /v3/help/thread/campaign-timeline`의 메시지. 타임라인의 실시간 상담 구간 메시지는
 * MySQL 행이 없어 `messageIdx`·`userIdx`가 null이고, `writeTime`은 Firestore 문자열 파싱에 실패하면 null(2026-10-28).
 */
export const inquiryMessageSchema = z.object({
  messageIdx: z.number().nullable(),
  threadIdx: z.number(),
  body: z.string(),
  userIdx: z.number().nullable(),
  attachmentIdx: z.number().nullable(),
  writeTime: z.string().nullable(),
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

/** `GET /v3/help/bigbird-inquiry`의 항목. 메시지는 없고 대화는 상세·타임라인 API로 받음. */
export const bigbirdInquiryListItemSchema = z.object({
  threadIdx: z.number(),
  sequence: z.number().nullable(),
  campaignIdx: z.number().nullable(),
  /**
   * 캠페인 정보. 기타 문의(`campaignIdx` null)면 null. 2026-11-02 stage에 추가돼 아직 배포 안 된 서버에서는
   * 빠질 수 있어 없어도 받음(없으면 캠페인 목록에서 찾음).
   */
  brandName: z.string().nullish(),
  productName: z.string().nullish(),
  status: z.enum(["WAITING", "IN_PROGRESS", "ANSWERED"]),
  /** 포맷 완료 문자열(`2026-10-20 14:03`). */
  created: z.string(),
  /** null이면 진행 중. */
  finishTime: z.string().nullable(),
  /** 명세에 required가 아니라 없을 수 있음. 없으면 문의 남기기로 봄. */
  boardType: z.boolean().optional(),
});
export type BigbirdInquiryListItem = z.infer<
  typeof bigbirdInquiryListItemSchema
>;

/** 무한 스크롤 목록(`offset`·`limit`). `hasMore`가 false면 요청을 멈춤. */
export const bigbirdInquiryListSchema = z.object({
  result: z.boolean(),
  list: z.array(bigbirdInquiryListItemSchema),
  hasMore: z.boolean(),
});

/** `GET /v3/help/bigbird-inquiry/{threadIdx}`. 스레드 한 건과 대화 전문. */
export const bigbirdInquiryDetailSchema = z.object({
  result: z.boolean(),
  data: z.object({ messages: z.array(inquiryMessageSchema).nullable() }),
});

/**
 * 캠페인 통합 타임라인(`GET /v3/help/thread/campaign-timeline`·`/inquiry/influencer-campaign-timeline`·
 * `/inquiry/purchaser-campaign-timeline`). 캠페인에 걸린 모든 스레드의 메시지를 실시간 구간까지 시간순으로 합친 목록.
 * 최상위 값은 가장 마지막 스레드의 것이고 스레드가 없으면 null(Swagger 2026-11-04). 구버전 서버는 없어도 읽음.
 */
export const campaignTimelineSchema = z.object({
  result: z.boolean(),
  data: z.array(inquiryMessageSchema),
  finishTime: z.string().nullish(),
  /** false면 실시간 상담 중. */
  isBoardType: z.boolean().nullish(),
  /** Firestore 상담 문서 ID(`sequence`). */
  sequence: z.number().nullish(),
});

export const inquiryThreadListSchema = z.object({
  result: z.boolean(),
  data: z.array(inquiryThreadSchema),
});

/** `GET /v3/help/c-client-campaign`의 항목. */
export const inquiryCampaignSchema = z.object({
  campaignIdx: z.number(),
  campaignCode: z.string(),
  brandName: z.string(),
  /** 스웨거는 required string이지만 stage가 null을 줌(2026-11-02 실측 3,054건 중 1,224건, 백엔드 수정 요청 중). */
  productName: z.string().nullable(),
  mainImageUrl: z.string().nullable(),
  /** 진행기간(`yyyy-MM-dd`). 값이 없을 수 있음(Swagger required + nullable). */
  progressStartDate: z.string().nullable(),
  progressEndDate: z.string().nullable(),
  /** 캠페인 유형 표시명(예: "베이직형"). 서버 DB 값이라 번역하지 않고 그대로 보여 줍니다. 아직 없는 서버를 위해 없음도 받습니다. */
  campaignServiceName: z.string().nullish(),
});
export type InquiryCampaign = z.infer<typeof inquiryCampaignSchema>;

/**
 * `GET /v3/help/thread/campaign/{campaignIdx}`: 대화 캠페인 카드·상세 정보 패널용 캠페인 정보.
 * 유형·진행 상태는 서버가 주는 표시 문구. 공구샵이 없으면 이미지·공구샵 코드가 null, 내 캠페인이 아니면 404.
 */
export const inquiryCampaignDetailSchema = z.object({
  result: z.boolean(),
  mainImageUrl: z.string().nullish(),
  campaignType: z.string().nullish(),
  progressStatus: z.string().nullish(),
  progressStartDate: z.string().nullish(),
  progressEndDate: z.string().nullish(),
  shopCode: z.string().nullish(),
});
export type InquiryCampaignDetail = z.infer<typeof inquiryCampaignDetailSchema>;

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

/**
 * 기존 헬프데스크 Firestore `sequence/{sequence}`의 상담 문서. 일반 문의로 만든 문서(백엔드가 씀)와 실시간 문서가
 * 같은 경로를 쓰고, 일반 문서에는 `sequence`·`threadIdx`·`isConnect`가 없고 `finishTime`이 Timestamp이며 메시지의
 * `isUserMessage`가 null일 수 있음(2026-10-29 dev 확인). 그래서 이 필드들은 없어도 읽을 수 있어야 함.
 */
/**
 * 구매자가 실시간 상담을 요청할 때 마켓이 구매자 계정 문서에 쓰는 데스크톱 알림 내용(`alarmData`). 광고주가 수락하면
 * null이 됨. `title`·`body`의 `/`는 줄바꿈 자리(v2와 같음).
 */
export const realtimeAlarmSchema = z.object({
  title: z.string(),
  body: z.string().nullish(),
  icon: z.string().nullish(),
  campaignIdx: z.number().nullish(),
});
export type RealtimeAlarm = z.infer<typeof realtimeAlarmSchema>;

export const realtimeConsultationSchema = z.object({
  sequence: z.number().nullish(),
  threadIdx: z.number().nullish(),
  isConnect: z.boolean().nullish(),
  finishTime: z.preprocess(normalizeFirestoreTime, z.string().nullish()),
  // 다른 앱이 읽는 기존 필드. 요청 시각 판단에는 REST의 created를 쓰고 여기서는 읽기만 함.
  seqResponseDate: z.string().nullish(),
  // 실시간 상담 상태 계약(specs/customer-center/customer-center.md)의 추가 필드. 없는 과거 문서도 읽을 수 있어야 함.
  origin: z.enum(["v2", "v3"]).nullish(),
  // 서버(2026-11-02 stage 배포)는 Timestamp로, v2·마켓·프론트는 문자열로 씀. 둘 다 문자열로 통일해 읽음.
  waitDeadline: z.preprocess(normalizeFirestoreTime, z.string().nullish()),
  // 서버가 실시간 요청 때 쓰는 요청 시각(Timestamp). 연결 판단의 기준.
  matchRequestedAt: z.preprocess(normalizeFirestoreTime, z.string().nullish()),
  // 수락(버튼·첫 답장) 때 서버가 쓰는 시각(Timestamp, 2026-11-03 백엔드 답변). 연결 판단의 기준.
  acceptedAt: z.preprocess(normalizeFirestoreTime, z.string().nullish()),
  canceledAt: z.preprocess(normalizeFirestoreTime, z.string().nullish()),
  // 서버가 상담을 끝낼 때 쓰는 사유(MATCH_TIMEOUT·INACTIVITY_TIMEOUT·REQUESTER_FINISHED·RESPONDER_FINISHED). 새 값이 와도 읽도록 문자열.
  endReason: z.string().nullish(),
  expiredAt: z.preprocess(normalizeFirestoreTime, z.string().nullish()),
  closingAt: z.preprocess(normalizeFirestoreTime, z.string().nullish()),
  messages: z.array(
    z.object({
      auto: z.boolean(),
      attachmentIdx: z.number().nullable(),
      identifier: z.string().nullable(),
      /** 일반 문의로 쓴 메시지 일부는 null(발신 구분 없음). 내 메시지가 아닌 것으로 봄. */
      isUserMessage: z.boolean().nullish(),
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
  "text" | "campaignCard" | "image" | "video" | "file" | "system" | "notice";

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
  /** 상대가 읽었는지. 읽은 메시지는 수정·삭제할 수 없습니다(서버 409). */
  isRead: boolean;
  /** 보낸 뒤 수정된 메시지인지("편집됨" 표시). */
  isEdited: boolean;
  /** 보낸 계정 id(v2가 내 말풍선 위에 보여 주던 값). 모르면 null입니다. */
  senderId: string | null;
  campaign: CampaignCard | null;
  attachment: InquiryAttachment | null;
}

export interface BigbirdInquiryViewModel {
  threadIdx: number;
  sequence: number;
  campaignIdx: number | null;
  /** 목록 응답의 캠페인 브랜드명·상품명. 기타 문의거나 목록 밖에서 만든 값이면 없음. */
  brandName?: string | null;
  productName?: string | null;
  isRealtime: boolean;
  isFinished: boolean;
  status: BigbirdInquiryStatus;
  /** 실시간 상담의 단계. 일반 문의이거나 Firestore 상태를 아직 모르면 null. */
  realtimePhase: RealtimePhase | null;
  /** 연결 대기가 끝나는 시각(ms). Firestore 상태를 받은 실시간 상담만 있음. */
  connectDeadlineAt?: number;
  /** 연결된 상담에서 답을 기다리는 쪽과 그 시작 시각(ms). 연결 전·종료 뒤면 null. */
  idleTurn?: { waitingFor: "advertiser" | "operator"; since: number } | null;
  /** 요청 실패한 상담을 같은 문의로 다시 요청할 수 있는지(취소된 요청은 불가). */
  isRetryable?: boolean;
  createdAt: Date;
  messages: InquiryMessageViewModel[];
}

export interface InquiryCampaignDetailViewModel {
  imageUrl: string | null;
  typeName: string | null;
  progressStatus: string | null;
  /** `yyyy.MM.dd ~ yyyy.MM.dd`. 기간이 없으면 null. */
  period: string | null;
  shopCode: string | null;
}

export interface InquiryCampaignViewModel {
  campaignIdx: number;
  /** 캠페인 유형 표시명. 없으면 null. */
  typeName: string | null;
  campaignCode: string;
  brandName: string;
  productName: string;
  /** "브랜드 상품명"(Figma 표기). */
  name: string;
  imageUrl: string | null;
  /** 진행기간 표시 `yyyy.MM.dd ~ yyyy.MM.dd`(Figma). 기간이 없으면 null. */
  period: string | null;
}

/** 화면·URL의 출처 값과 서버 `sourceType`. 구매자 문의 메뉴는 앞의 둘, 인플루언서 문의 메뉴는 뒤의 둘. */
export const INQUIRY_SOURCE_TYPE = {
  purchaser: "PURCHASER_QUESTION",
  qna: "PRODUCT_QNA",
  influencer: "INFLUENCER_QUESTION",
  campaignQna: "CAMPAIGN_QNA",
} as const;
export type BuyerInquirySource = keyof typeof INQUIRY_SOURCE_TYPE;
export type InquirySourceType =
  (typeof INQUIRY_SOURCE_TYPE)[BuyerInquirySource];

/**
 * `GET /v3/help/inquiry` 항목: 구매자 문의·상품 Q&A·인플루언서 문의·캠페인 Q&A 통합 목록. 시각은 "2026-10-01 10:00" 형식.
 * `sourceType=ALL`이면 메뉴 권한에 따라 네 유형이 섞여 옴(Swagger 2026-11-02).
 */
export const buyerInquirySchema = z.object({
  inquiryIdx: z.number(),
  sourceType: z.enum([
    "PURCHASER_QUESTION",
    "PRODUCT_QNA",
    "INFLUENCER_QUESTION",
    "CAMPAIGN_QNA",
  ]),
  /** IN_PROGRESS는 구매자가 실시간 상담으로 바꾼 문의(2026-10-30 명세 추가). */
  status: z.enum(["WAITING", "ANSWERED", "IN_PROGRESS"]),
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
  hasUnread: z.boolean().default(false),
  /** 상담 Firestore 문서 ID. 구매자·인플루언서 문의만 값이 있음(Swagger 2026-11-04, stage 반영 전엔 없음). */
  sequence: z.number().nullish(),
  /** 카드 문구(REQ-24-0001)용. 백엔드 요청 중이라 아직 오지 않음. */
  brandName: z.string().nullish(),
  campaignName: z.string().nullish(),
  shopName: z.string().nullish(),
  /** 공구 진행 인플루언서 닉네임(client-be Swagger 2026-11-04). */
  influencerNickname: z.string().nullish(),
});
export type BuyerInquiry = z.infer<typeof buyerInquirySchema>;

const buyerSourceSchema = buyerInquirySchema.pick({ sourceType: true });

export const buyerInquiryListSchema = z.object({
  result: z.boolean(),
  // 서버가 인플루언서 문의(INFLUENCER_QUESTION) 등 다른 출처를 섞어 줌(stage 2026-11-02). 구매자 문의 화면은
  // 마켓 문의만 보이므로(사용자 결정) 모르는 출처는 목록 전체를 실패시키지 않고 건너뜀.
  list: z
    .array(z.unknown())
    .transform((items) =>
      items.filter((item) => buyerSourceSchema.safeParse(item).success),
    )
    .pipe(z.array(buyerInquirySchema)),
  pagingInfo: z.object({
    page: z.number(),
    size: z.number(),
    totalCount: z.number(),
    totalPage: z.number(),
  }),
});

/**
 * `GET /v3/help/inquiry/has-updates`·`/influencer-inquiry/has-updates` 목록 변경 확인(폴링용).
 * `checkedAt`은 서버 시각(KST, `yyyy-MM-dd HH:mm:ss`, 초 단위 2026-11-09 stage 확인)이고 다음 호출의 `since`로 그대로 씀.
 */
export const inquiryHasUpdatesSchema = z.object({
  result: z.boolean(),
  hasUpdates: z.boolean(),
  checkedAt: z.string(),
});

export const buyerInfluencerOptionsSchema = z.object({
  result: z.boolean(),
  list: z.array(
    // 이름이 없는 인플루언서는 null(2026-10-30 명세 변경). 화면이 번호로 대신 보여 줌.
    z.object({ threadUserIdx: z.number(), displayName: z.string().nullable() }),
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
  influencerNickname: z.string().nullish(),
  /** 공구샵 대표 이미지. 주문상품·캠페인 정보 공용이며 연관 캠페인이 없으면 null(Swagger). */
  mainImageUrl: z.string().nullable(),
  brandName: z.string().nullable(),
  productName: z.string().nullable(),
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

export type BuyerInquiryStatus = "waiting" | "consulting" | "done";

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
  /** 구매자·인플루언서 문의 대화 조회 키. Q&A면 null. */
  threadUserIdx: number | null;
  /** 상품·캠페인 Q&A 상세 조회 키. 구매자·인플루언서 문의면 null. */
  userIdx: number | null;
  /** 상담 Firestore 문서 ID(`helpdesk/0.0.2/threadUserIdx/{threadUserIdx}/sequence/{sequence}`). 없으면 null. */
  sequence: number | null;
  /** 목록 미리보기: 가장 최근 메시지 본문. */
  preview: string;
  /** 마지막 활동 시각. 메시지가 없는 스레드는 null. */
  lastActivityAt: Date | null;
  hasUnread: boolean;
  /** 서버가 준 카드 문구 값. 없으면 null이고 화면이 캠페인 목록에서 찾음. */
  brandName: string | null;
  campaignName: string | null;
  shopName: string | null;
  influencerNickname: string | null;
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
  /** 공구 진행 인플루언서 닉네임. 플랫폼 아이디·플랫폼 표시는 명세서 24 I26 삭제로 보이지 않음. */
  influencerNickname: string | null;
  /** 상세 응답의 대표 이미지. 상품·캠페인 목록에서 못 찾을 때 대신 씀. */
  imageUrl: string | null;
  /** 상품·캠페인 목록과 같은 "브랜드 상품명" 표기. 둘 다 없으면 null. */
  name: string | null;
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
