import { tryit } from "radash";

import { campaignCardSchema } from "../model/schema";
import { REALTIME_CLOSED_MESSAGE } from "./consultation-write";

import type {
  BigbirdInquiryListItem,
  BigbirdInquiryStatus,
  BigbirdInquiryViewModel,
  BuyerInquiry,
  BuyerInquiryDetail,
  BuyerInquiryDetailViewModel,
  BuyerInquiryViewModel,
  BuyerProductViewModel,
  CampaignCard,
  InquiryCampaign,
  InquiryCampaignDetail,
  InquiryCampaignDetailViewModel,
  InquiryCampaignViewModel,
  InquiryMessage,
  InquiryMessageKind,
  InquiryMessageViewModel,
  InquiryThread,
  PurchaserQuestionInfo,
  QnaDetailList,
  QnaItemViewModel,
  RealtimeConsultation,
} from "../model/schema";

/** 서버가 준 링크 중 http(s)만 통과시킴. 다른 스킴이나 깨진 값은 링크로 쓰지 않음. */
function toHttpUrl(value: string | null): string | null {
  if (!value) return null;
  // URL.parse는 아직 모든 브라우저에 없어 생성자를 씀.
  const [error, url] = tryit(() => new URL(value))();
  if (error) return null;
  return url.protocol === "http:" || url.protocol === "https:" ? value : null;
}

// ponytail: 시간대 없는 `yyyy-MM-ddTHH:mm:ss`를 브라우저 지역 시간으로 읽음(KST 가정).
// 서버 시간대가 확인되면 여기서만 고침.
function toDate(value: string): Date {
  return new Date(value.replace(" ", "T"));
}

// 운영 측 인사말 auto 메시지에 `</br>`가 들어 있음(stage 실데이터). HTML로 렌더하지 않으므로 줄바꿈으로 바꿈.
const BR_TAG = /<\/?br\s*\/?>/gi;
// v2는 메시지를 보낼 때 URL·이메일을 `<a class="autoLink" href=...>원문</a>`으로 감싸 저장함
// (v2 `BigbirdChatModal.vue:1048-1055`). 태그 안의 글자가 사용자가 입력한 원문이라 태그만 벗김.
const ANCHOR_TAG = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;

/** 기존 데이터에 섞인 `<br>`·`<a>` HTML을 화면에 그대로 쓸 수 있는 텍스트로 바꿈. */
function toPlainBody(value: string): string {
  return value.replace(BR_TAG, "\n").replace(ANCHOR_TAG, "$1");
}

function parseCampaignCard(
  message: Pick<InquiryMessage, "auto" | "body">,
): CampaignCard | null {
  if (!message.auto || !message.body.startsWith("{")) return null;
  try {
    const parsed = campaignCardSchema.safeParse(JSON.parse(message.body));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// Figma 상세 정보(6766:48186)는 "브랜드 상품명"으로 씁니다(v2의 "[브랜드]상품명" 아님). 브랜드가 비면 상품명만 씁니다.
function toProductName(brandName: string, productName: string) {
  return [brandName, productName].filter(Boolean).join(" ");
}

// 문서는 image 경로로 올라가 서버가 fileType을 image로 줄 수 있어 파일 이름으로 먼저 가림.
const DOCUMENT_EXTENSION = /\.(pdf|txt|docx?|xlsx?|pptx?)$/i;

function toKind(
  message: Pick<
    InquiryMessage,
    "auto" | "body" | "attachmentIdx" | "fileType"
  > & {
    fileName?: string | null;
  },
  campaign: CampaignCard | null,
): InquiryMessageKind {
  if (campaign) return "campaignCard";
  // 상담 종료 안내는 자동 메시지지만 대화에 보여 줌(사용자 결정 2026-10-29). 나머지 자동 안내는 숨김.
  if (message.auto && message.body !== REALTIME_CLOSED_MESSAGE) return "system";
  if (message.attachmentIdx === null) return "text";
  if (DOCUMENT_EXTENSION.test(message.fileName ?? "")) return "file";
  if (message.fileType?.startsWith("image")) return "image";
  if (message.fileType?.startsWith("video")) return "video";
  return "file";
}

/**
 * `fallback`은 서버 값이 null일 때 쓰는 값. 실시간 구간 메시지는 `messageIdx`가 없어 음수 id(수정·삭제 불가 표시)를,
 * 시각 파싱에 실패한 메시지는 앞 메시지의 시각을 씀.
 */
export function transformInquiryMessageToViewModel(
  message: InquiryMessage,
  fallback: { id: number; createdAt: Date } = { id: -1, createdAt: new Date() },
): InquiryMessageViewModel {
  const campaign = parseCampaignCard(message);
  return {
    id: message.messageIdx ?? fallback.id,
    // 캠페인 카드는 v2 호환으로 광고주가 보낸 auto 메시지(isUserMessage: false)로 저장됨. 내가 보낸 카드로 그림.
    isMine: message.isUserMessage || campaign !== null,
    kind: toKind(message, campaign),
    body: toPlainBody(message.body),
    createdAt: message.writeTime
      ? toDate(message.writeTime)
      : fallback.createdAt,
    isDeleted: message.deleteTime !== null,
    isRead: message.readTime !== null,
    isEdited: message.modifyTime !== null,
    senderId: message.identifier || null,
    campaign,
    attachment:
      message.attachmentIdx === null
        ? null
        : {
            attachmentIdx: message.attachmentIdx,
            fileName: message.fileName,
            fileSize: message.fileSize,
            fileType: message.fileType,
          },
  };
}

/** 메시지 목록을 뷰모델로 바꿈. 시각이 null인 메시지는 앞 메시지(없으면 뒤 메시지) 시각을 이어 씀. */
export function transformInquiryMessagesToViewModels(
  messages: InquiryMessage[],
): InquiryMessageViewModel[] {
  const firstTime = messages.find((message) => message.writeTime)?.writeTime;
  let previousAt = firstTime ? toDate(firstTime) : new Date();
  return messages.map((message, index) => {
    const viewModel = transformInquiryMessageToViewModel(message, {
      id: -(index + 1),
      createdAt: previousAt,
    });
    previousAt = viewModel.createdAt;
    return viewModel;
  });
}

// 실시간 상담에서 같은 종료 안내가 여러 번 쌓인 이력이 있어, 연속된 동일 auto 메시지는 하나만 둠.
function dropRepeatedAutoMessages<
  T extends Pick<InquiryMessage, "auto" | "body">,
>(messages: T[]) {
  return messages.filter((message, index) => {
    const previous = messages[index - 1];
    return !(message.auto && previous?.auto && previous.body === message.body);
  });
}

/** Firestore 상담 문서의 메시지를 기존 대화 UI의 뷰모델로 바꿈. */
export function transformRealtimeConsultationMessages(
  consultation: RealtimeConsultation,
): InquiryMessageViewModel[] {
  return dropRepeatedAutoMessages(consultation.messages).map(
    (message, index) => {
      const campaign = parseCampaignCard(message);
      return {
        id: index,
        // 캠페인 카드는 v2 호환으로 광고주가 보낸 auto 메시지(isUserMessage: false)로 저장됨.
        // 화면에서는 내가 보낸 카드로 그림.
        isMine: message.isUserMessage || campaign !== null,
        kind: toKind(
          { ...message, fileType: message.fileType ?? null },
          campaign,
        ),
        body: toPlainBody(message.body),
        createdAt: toDate(message.created),
        isDeleted: false,
        isRead: false,
        isEdited: false,
        senderId: message.identifier || null,
        campaign,
        attachment:
          message.attachmentIdx === null
            ? null
            : {
                attachmentIdx: message.attachmentIdx,
                fileName: message.fileName ?? null,
                fileSize: null,
                fileType: message.fileType ?? null,
              },
      };
    },
  );
}

const THREAD_STATUS: Record<
  BigbirdInquiryListItem["status"],
  BigbirdInquiryStatus
> = {
  WAITING: "waiting",
  IN_PROGRESS: "consulting",
  ANSWERED: "done",
};

export function transformInquiryThreadToViewModel(
  thread: InquiryThread,
): BigbirdInquiryViewModel {
  const messages = thread.messages ?? [];
  return {
    threadIdx: thread.threadIdx,
    sequence: thread.sequence,
    campaignIdx: thread.campaignIdx,
    isRealtime: !thread.boardType,
    isFinished: thread.finishTime !== null,
    status: THREAD_STATUS[thread.status],
    realtimePhase: null,
    createdAt: toDate(thread.created),
    messages: transformInquiryMessagesToViewModels(
      dropRepeatedAutoMessages(messages),
    ),
  };
}

/** 상세 API의 대화 전문. 목록의 스레드와 같은 방식으로 반복 자동 메시지를 걸러 냄. */
export function transformBigbirdInquiryDetailMessages(
  messages: InquiryMessage[] | null,
) {
  return transformInquiryMessagesToViewModels(
    dropRepeatedAutoMessages(messages ?? []),
  );
}

/** 목록 항목은 메시지가 없어 대화는 비워 둠. 대화는 상세·타임라인 API로 받음. */
export function transformBigbirdInquiryListItemToViewModel(
  item: BigbirdInquiryListItem,
): BigbirdInquiryViewModel {
  return {
    threadIdx: item.threadIdx,
    sequence: item.sequence ?? 0,
    campaignIdx: item.campaignIdx,
    isRealtime: item.boardType === false,
    isFinished: item.finishTime !== null,
    status: THREAD_STATUS[item.status],
    realtimePhase: null,
    createdAt: toDate(item.created),
    messages: [],
  };
}

export function transformInquiryCampaignToViewModel(
  campaign: InquiryCampaign,
): InquiryCampaignViewModel {
  return {
    campaignIdx: campaign.campaignIdx,
    typeName: campaign.campaignServiceName ?? null,
    campaignCode: campaign.campaignCode,
    brandName: campaign.brandName,
    // 상품명 null은 빈 문자열로 둬서 소비처의 `trim() ||` 대체 처리를 그대로 탐.
    productName: campaign.productName ?? "",
    name: toProductName(campaign.brandName, campaign.productName ?? ""),
    imageUrl: campaign.mainImageUrl,
    period: toCampaignPeriod(
      campaign.progressStartDate,
      campaign.progressEndDate,
    ),
  };
}

/**
 * 방금 등록한 문의를 서버 목록 응답이 오기 전에 대화 화면에 먼저 보여 주기 위한 임시 뷰모델.
 * 목록 조회가 수 초 걸려도 이동 직후 대화가 보이게 하며, 재조회가 끝나면 서버 값으로 교체됨.
 * 메시지 id는 서버 값과 겹치지 않게 음수로 둠. 첨부는 담지 않음(업로드 진행은 대화 화면의 업로드 상태 줄이
 * 보여 주고, 올라간 파일은 재조회 뒤에 나타남).
 */
export function buildSubmittedInquiryViewModel(input: {
  threadIdx: number;
  campaign: InquiryCampaignViewModel | null;
  body: string;
}): BigbirdInquiryViewModel {
  const now = new Date();
  const base = {
    isMine: true,
    createdAt: now,
    isDeleted: false,
    isRead: false,
    isEdited: false,
    senderId: null,
    attachment: null,
  };
  const messages: InquiryMessageViewModel[] = [];
  if (input.campaign) {
    messages.push({
      ...base,
      id: -1,
      kind: "campaignCard",
      body: toCampaignCardBody(input.campaign),
      campaign: {
        mainImageUrl: input.campaign.imageUrl,
        campaignCode: input.campaign.campaignCode,
        brandName: input.campaign.brandName,
        productName: input.campaign.productName,
      },
    });
  }
  if (input.body.trim()) {
    messages.push({
      ...base,
      id: -2,
      kind: "text",
      body: input.body,
      campaign: null,
    });
  }
  return {
    threadIdx: input.threadIdx,
    sequence: 0,
    campaignIdx: input.campaign?.campaignIdx ?? null,
    isRealtime: false,
    isFinished: false,
    status: "waiting",
    realtimePhase: null,
    createdAt: now,
    messages,
  };
}

export function transformInquiryCampaignDetailToViewModel(
  detail: InquiryCampaignDetail,
): InquiryCampaignDetailViewModel {
  return {
    imageUrl: detail.mainImageUrl || null,
    typeName: detail.campaignType || null,
    progressStatus: detail.progressStatus || null,
    period: toCampaignPeriod(
      detail.progressStartDate ?? null,
      detail.progressEndDate ?? null,
    ),
    shopCode: detail.shopCode || null,
  };
}

/** `2026-10-01`·`2026-10-31`을 시안 표기 `2026.10.01 ~ 2026.10.31`로 바꿈. 둘 중 하나라도 없으면 null. */
function toCampaignPeriod(start: string | null, end: string | null) {
  if (!start || !end) return null;
  return `${start.replaceAll("-", ".")} ~ ${end.replaceAll("-", ".")}`;
}

/**
 * 캠페인 문의 생성 직후 보내는 auto 메시지 본문. 운영 앱이 `JSON.parse`해 캠페인 카드를 그리므로
 * v2(`BigbirdChatModal.vue`의 `pickCampaignData`)와 같은 필드로 만듦.
 */
export function toCampaignCardBody(campaign: InquiryCampaignViewModel) {
  return JSON.stringify({
    mainImageUrl: campaign.imageUrl,
    campaignCode: campaign.campaignCode,
    brandName: campaign.brandName,
    productName: campaign.productName,
    campaignIdx: campaign.campaignIdx,
  });
}

// 구매자 목록의 시각은 "2026-10-01 10:00"(시간대 없음). 공백 형식은 Safari에서 읽지 못하는 경우가 있어 `T`로 바꿈.
function toListDate(value: string | null): Date | null {
  return value === null ? null : new Date(value.replace(" ", "T"));
}

const BUYER_STATUS = {
  WAITING: "waiting",
  IN_PROGRESS: "consulting",
  ANSWERED: "done",
} as const satisfies Record<
  BuyerInquiry["status"],
  BuyerInquiryViewModel["status"]
>;

export function transformBuyerInquiryToViewModel(
  inquiry: BuyerInquiry,
): BuyerInquiryViewModel {
  const source = inquiry.sourceType === "PRODUCT_QNA" ? "qna" : "purchaser";
  return {
    key: `${source}-${inquiry.inquiryIdx}`,
    inquiryIdx: inquiry.inquiryIdx,
    source,
    status: BUYER_STATUS[inquiry.status],
    campaignIdx: inquiry.campaignIdx,
    orderNumber: inquiry.orderNumber,
    writerName: inquiry.writerName,
    body: inquiry.body === null ? null : toPlainBody(inquiry.body),
    writeTime: toListDate(inquiry.writeTime),
    threadUserIdx: inquiry.threadUserIdx,
    userIdx: inquiry.userIdx,
    preview: toPlainBody(inquiry.body ?? ""),
    lastActivityAt: toListDate(inquiry.writeTime),
    hasUnread: inquiry.hasUnread,
    brandName: inquiry.brandName || null,
    campaignName: inquiry.campaignName || null,
    shopName: inquiry.shopName || null,
  };
}

export function transformBuyerInquiryDetailToViewModel(
  detail: BuyerInquiryDetail,
): BuyerInquiryDetailViewModel {
  return {
    writerName: detail.writerName,
    email: detail.email,
    phoneNumber: detail.phoneNumber,
    orderNumber: detail.orderNumber,
    orderDate: detail.orderDate,
    paymentAmount: detail.paymentAmount,
    campaignType: detail.campaignType,
    campaignCode: detail.campaignCode,
    shopCode: detail.shopCode,
    progressStatus: detail.progressStatus,
    progressStartDate: detail.progressStartDate,
    progressEndDate: detail.progressEndDate,
    influencerPlatform: detail.influencerPlatform,
    influencerAccountLink: toHttpUrl(detail.influencerAccountLink),
    influencerAccountName: toAccountName(detail.influencerAccountLink),
    imageUrl: detail.mainImageUrl,
    name:
      toProductName(detail.brandName ?? "", detail.productName ?? "") || null,
  };
}

// 서버가 "플랫폼 URL 패턴 + 닉네임"으로 링크를 조합하므로(Swagger) 마지막 경로가 계정명
function toAccountName(link: string | null): string | null {
  const url = toHttpUrl(link);
  if (!url) return null;
  const name = new URL(url).pathname.split("/").filter(Boolean).at(-1);
  if (!name) return null;
  // 깨진 퍼센트 인코딩(%zz)은 decodeURIComponent가 예외를 던져 상세 전체가 실패하므로 원문을 씀
  const [error, decoded] = tryit(() => decodeURIComponent(name))();
  return (error ? name : decoded).replace(/^@/, "");
}

/** 주문/상품 정보를 상세 패널의 상품 표시(이름은 "브랜드 상품명")로 바꿈. */
export function transformPurchaserQuestionInfoToViewModel(
  info: PurchaserQuestionInfo,
): BuyerProductViewModel {
  return {
    name: toProductName(info.brandName, info.productName),
    imageUrl: info.mainImageUrl,
  };
}

export function transformQnaListToViewModel(
  response: QnaDetailList,
): QnaItemViewModel[] {
  return response.list.map(({ campaignInfo, inquiryInfo, replyInfo }) => ({
    inquiryIdx: inquiryInfo.inquiryIdx,
    productName: campaignInfo.productName,
    productImageUrl: campaignInfo.mainImageUrl,
    optionName: campaignInfo.optionName,
    inquiryType: inquiryInfo.inquiryType,
    question: {
      body: toPlainBody(inquiryInfo.body),
      writtenAt: toDate(inquiryInfo.writeTime),
      isDeleted: inquiryInfo.deleteTime != null,
    },
    // 답변이 없으면 객체가 비어 있고, 지워진 답변은 보여 주지 않음.
    reply:
      replyInfo.replyIdx == null ||
      replyInfo.body == null ||
      replyInfo.deleteTime != null
        ? null
        : {
            replyIdx: replyInfo.replyIdx,
            body: toPlainBody(replyInfo.body),
            writtenAt: replyInfo.writeTime ? toDate(replyInfo.writeTime) : null,
            isRead: replyInfo.readTime != null,
          },
  }));
}
