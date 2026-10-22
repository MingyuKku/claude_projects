import useSWR from "swr";
import useSWRInfinite from "swr/infinite";

import { ApiError, isApiError, serverApiV3 } from "@/shared/api";
import { ENV } from "@/shared/config";

import { getAttachmentKind } from "../lib/attachment-rules";
import {
  transformBuyerInquiryDetailToViewModel,
  transformBuyerInquiryToViewModel,
  transformPurchaserQuestionInfoToViewModel,
  transformQnaListToViewModel,
  transformInquiryCampaignToViewModel,
  transformInquiryThreadToViewModel,
} from "../lib/transform-inquiry";
import {
  buyerInquiryDetailSchema,
  buyerInquiryListSchema,
  buyerInfluencerOptionsSchema,
  createInquiryThreadResultSchema,
  inquiryCampaignListSchema,
  inquiryThreadListSchema,
  inquiryUserSchema,
  purchaserQuestionInfoSchema,
  qnaDetailListSchema,
  replyResultSchema,
  sendInquiryMessageResultSchema,
  simpleResultSchema,
  uploadInquiryAttachmentResultSchema,
} from "../model/schema";
import { useLiveInquiries } from "./use-live-inquiries";

import type { BuyerInquiryViewModel, InquiryThread } from "../model/schema";

// 첨부 업로드 경로의 {service} 값. v2는 문자열 "undefined"를 보냈고 V3 명세는 허용 값을 적지 않아 백엔드 답변 전 임시값.
// ponytail: 답변이 오면 이 상수만 바꿈(경로의 {type}은 파일 종류 image|video).
export const ATTACHMENT_UPLOAD_SERVICE = "help";

export type InquiryThreadStatusFilter = "ALL" | InquiryThread["status"];

// V3는 v2 로직을 감싼 것이라, 실패를 HTTP 200 + `result: false`로 주는 경로가 있음.
// 이 경우도 요청 실패로 다룸. 오류 본문은 형태가 정의되지 않아 읽지 않음.
function ensureSucceeded<T extends { result: boolean }>(response: T): T {
  if (!response.result) throw new ApiError(200, response);
  return response;
}

export async function fetchBigbirdInquiries(
  threadUserIdx: number,
  status: InquiryThreadStatusFilter = "ALL",
) {
  try {
    const response = await serverApiV3.get("/help/thread", {
      params: { threadUserIdx, status },
    });
    const { data } = ensureSucceeded(inquiryThreadListSchema.parse(response));
    // 목록과 LNB 진입 시 자동 선택이 최신 문의 기준.
    return data
      .map(transformInquiryThreadToViewModel)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    // 명세상 404는 "유저가 없거나 대화 내역이 없음". 세션의 내 threadUserIdx로
    // 조회하므로 문의가 없는 것으로 봄. 다른 오류는 문의 없음으로 바꾸지 않음.
    if (isApiError(error) && error.status === 404) return [];
    throw error;
  }
}

/** 빅버드 문의 목록과 각 문의의 대화. `threadUserIdx`는 세션 값. */
export function useBigbirdInquiries(
  threadUserIdx: number | undefined,
  status: InquiryThreadStatusFilter = "ALL",
) {
  const { data, isLoading, error, mutate } = useSWR(
    threadUserIdx === undefined
      ? null
      : ["bigbird-inquiries", threadUserIdx, status],
    ([, idx, selectedStatus]) => fetchBigbirdInquiries(idx, selectedStatus),
    // 일반 문의 대화는 한 번 조회하는 REST라, 열어 둔 사이에 온 운영자 답장은 탭으로 돌아올 때 다시 받아 보여 줌.
    // 앱 전체 기본은 꺼져 있어서(SWRProvider) 이 화면만 켬.
    { revalidateOnFocus: true },
  );
  // 실시간 상담의 연결·종료 상태를 합침(상담 중·요청 실패 표시).
  const inquiries = useLiveInquiries(threadUserIdx, data);
  return { inquiries, isLoading, isError: Boolean(error), mutate };
}

export async function fetchInquiryCampaigns() {
  const response = await serverApiV3.get("/help/c-client-campaign");
  const { list } = ensureSucceeded(inquiryCampaignListSchema.parse(response));
  return list.map(transformInquiryCampaignToViewModel);
}

/** 새 문의에서 고를 수 있는 캠페인 목록. 계정이 바뀌면 다른 목록이라 세션 값을 키에 넣음. */
export function useInquiryCampaigns(threadUserIdx: number | undefined) {
  const { data, isLoading, error, mutate } = useSWR(
    threadUserIdx === undefined ? null : ["inquiry-campaigns", threadUserIdx],
    fetchInquiryCampaigns,
  );
  return { campaigns: data, isLoading, isError: Boolean(error), mutate };
}

/** 선택한 캠페인에 참여한 인플루언서 옵션. */
export function useBuyerInfluencerOptions(campaignIdx: number | undefined) {
  const { data, isLoading, error } = useSWR(
    campaignIdx === undefined
      ? null
      : ["buyer-influencer-options", campaignIdx],
    async ([, idx]) => {
      const response = await serverApiV3.get("/help/influencer-filter", {
        params: { campaignIdx: idx },
      });
      return ensureSucceeded(buyerInfluencerOptionsSchema.parse(response)).list;
    },
  );
  return { options: data, isLoading, isError: Boolean(error) };
}

/** 문의 남기기(게시판형) 문의를 만듦. 기타 문의는 `campaignIdx`가 null. */
export async function createBigbirdInquiry(campaignIdx: number | null) {
  const response = await serverApiV3.post("/help/thread", {
    isBoardType: true,
    campaignIdx,
  });
  return ensureSucceeded(createInquiryThreadResultSchema.parse(response)).data;
}

interface SendInquiryMessageArgs {
  threadIdx: number;
  body: string;
  isAuto?: boolean;
  /** 첨부 메시지면 업로드 응답의 값. 이때 `body`는 업로드 응답의 `url`(v2 동일). */
  attachmentIdx?: number | null;
}

/**
 * 메시지를 보내고 실제로 저장된 `threadIdx`를 돌려줌. 보낸 스레드가 그사이 종료됐으면
 * 서버가 새 스레드를 만들어 다른 값이 옴. 호출하는 쪽에서 요청한 값과 비교함.
 */
export async function sendInquiryMessage({
  threadIdx,
  body,
  isAuto = false,
  attachmentIdx = null,
}: SendInquiryMessageArgs) {
  const response = await serverApiV3.post("/help/thread/message", {
    threadIdx,
    body,
    attachmentIdx,
    isAuto,
  });
  return ensureSucceeded(sendInquiryMessageResultSchema.parse(response))
    .threadIdx;
}

export async function closeBigbirdInquiry(threadIdx: number) {
  const response = await serverApiV3.put(`/help/thread/${threadIdx}`);
  ensureSucceeded(simpleResultSchema.parse(response));
}

/** 파일 하나를 올리고 메시지로 보낼 `attachmentIdx`·`url`을 받음. 허용하지 않는 형식은 호출 전에 걸러야 함. */
export async function uploadInquiryAttachment(file: File) {
  const kind = getAttachmentKind(file);
  if (!kind) throw new Error(`허용하지 않는 첨부 형식: ${file.name}`);
  const form = new FormData();
  form.append("file", file);
  const response = await serverApiV3.post(
    `/help/message/${kind}/${ATTACHMENT_UPLOAD_SERVICE}`,
    form,
  );
  const { url, attachmentIdx, fileName, fileSize } = ensureSucceeded(
    uploadInquiryAttachmentResultSchema.parse(response),
  );
  return { url, attachmentIdx, fileName, fileSize };
}

/** 첨부 받기 주소(`GET /v3/help/file/download/{type}/{attachmentIdx}`). 바이너리 응답이라 링크로 엶. */
export function getAttachmentDownloadUrl(
  kind: "image" | "video",
  attachmentIdx: number,
) {
  return `${ENV.apiServerUrl}/v3/help/file/download/${kind}/${attachmentIdx}`;
}

export type BuyerInquiryStatusFilter = "all" | "waiting" | "done";
export interface BuyerInquiryFilters {
  sourceType: "ALL" | "PURCHASER_QUESTION" | "PRODUCT_QNA";
  campaignIdx?: number;
  influencerThreadUserIdx?: number;
  /** 검색어(이름 또는 주문번호). 비어 있으면 검색하지 않음. */
  keyword?: string;
}

/**
 * 검색 입력은 하나라서 서버의 검색 기준(`searchType`)을 검색어로 정함. 숫자와 하이픈만 있으면 주문번호, 그 밖에는
 * 이름(2026-10-21 가정: 주문번호 형식은 코드로 확인하지 못했고, 이름에 숫자만 있는 경우는 없다고 봄).
 */
export function toBuyerSearchType(keyword: string) {
  return /^[0-9-]+$/.test(keyword) ? "orderNumber" : "name";
}

const BUYER_STATUS_PARAM = {
  all: "ALL",
  waiting: "WAITING",
  done: "ANSWERED",
} as const;

/** 한 번에 받는 문의 수. 목록 끝까지 스크롤하면 다음 쪽을 받음. */
export const BUYER_INQUIRY_PAGE_SIZE = 20;

export async function fetchBuyerInquiryPage(
  status: BuyerInquiryStatusFilter,
  page: number,
  filters: BuyerInquiryFilters = { sourceType: "ALL" },
) {
  const response = await serverApiV3.get("/help/inquiry", {
    params: {
      status: BUYER_STATUS_PARAM[status],
      sourceType: filters.sourceType,
      ...(filters.campaignIdx === undefined
        ? {}
        : { campaignIdx: filters.campaignIdx }),
      ...(filters.influencerThreadUserIdx === undefined
        ? {}
        : { influencerThreadUserIdx: filters.influencerThreadUserIdx }),
      ...(filters.keyword
        ? {
            searchType: toBuyerSearchType(filters.keyword),
            keyword: filters.keyword,
          }
        : {}),
      page,
      entrySize: BUYER_INQUIRY_PAGE_SIZE,
    },
  });
  const { list, pagingInfo } = ensureSucceeded(
    buyerInquiryListSchema.parse(response),
  );
  return {
    inquiries: list.map(transformBuyerInquiryToViewModel),
    page: pagingInfo.page,
    totalPage: pagingInfo.totalPage,
    totalCount: pagingInfo.totalCount,
  };
}

/** 구매자 문의 + 상품 Q&A 통합 목록. 탭(상태)이 바뀌면 처음 쪽부터 다시 받음. */
export function useBuyerInquiries(
  status: BuyerInquiryStatusFilter,
  filters: BuyerInquiryFilters = { sourceType: "ALL" },
) {
  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(
      (index, previous: { totalPage: number } | null) =>
        previous && index >= previous.totalPage
          ? null
          : [
              "buyer-inquiries",
              status,
              filters.sourceType,
              filters.campaignIdx,
              filters.influencerThreadUserIdx,
              filters.keyword,
              index + 1,
            ],
      ([
        ,
        filter,
        sourceType,
        campaignIdx,
        influencerThreadUserIdx,
        keyword,
        page,
      ]: readonly [
        string,
        BuyerInquiryStatusFilter,
        BuyerInquiryFilters["sourceType"],
        number | undefined,
        number | undefined,
        string | undefined,
        number,
      ]) =>
        fetchBuyerInquiryPage(filter, page, {
          sourceType,
          campaignIdx,
          influencerThreadUserIdx,
          keyword,
        }),
      { revalidateFirstPage: true },
    );
  const last = data?.[data.length - 1];
  const hasMore = last !== undefined && last.page < last.totalPage;
  return {
    inquiries: data?.flatMap((page) => page.inquiries),
    isLoading,
    isError: Boolean(error),
    isLoadingMore: isValidating && size > (data?.length ?? 0),
    hasMore,
    loadMore: () => void setSize(size + 1),
    mutate,
  };
}

/** 구매자 문의·상품 Q&A 상세 패널(`GET /v3/help/inquiry/{inquiryIdx}`). `sourceType`은 목록 행의 값 그대로. */
export async function fetchBuyerInquiryDetail(
  inquiryIdx: number,
  sourceType: "PURCHASER_QUESTION" | "PRODUCT_QNA",
) {
  const response = await serverApiV3.get(`/help/inquiry/${inquiryIdx}`, {
    params: { sourceType },
  });
  return transformBuyerInquiryDetailToViewModel(
    ensureSucceeded(buyerInquiryDetailSchema.parse(response)),
  );
}

/** 문의자 프로필(`GET /v3/help/user/{threadUserIdx}`). 비회원·이미지 없음이면 `null`이라 기본 아바타를 씀. */
export async function fetchInquiryUserImage(threadUserIdx: number) {
  const response = await serverApiV3.get(`/help/user/${threadUserIdx}`);
  return (
    ensureSucceeded(inquiryUserSchema.parse(response)).data.profileImage ?? null
  );
}

/** 문의자 프로필 이미지 주소. 받지 못하면(실패·없음) 기본 아바타를 쓰도록 `undefined`. */
export function useInquiryUserImage(threadUserIdx: number | null) {
  const { data } = useSWR(
    threadUserIdx === null ? null : ["inquiry-user-image", threadUserIdx],
    ([, idx]) => fetchInquiryUserImage(idx),
  );
  return data ?? undefined;
}

/** 구매자 문의 상세의 상품(`GET /v3/help/c-purchaser-questionInfo/{orderNumber}`). 상품 Q&A처럼 주문번호가 없으면 조회하지 않음. */
export async function fetchBuyerProduct(orderNumber: string) {
  const response = await serverApiV3.get(
    `/help/c-purchaser-questionInfo/${encodeURIComponent(orderNumber)}`,
  );
  return transformPurchaserQuestionInfoToViewModel(
    ensureSucceeded(purchaserQuestionInfoSchema.parse(response)).list,
  );
}

export function useBuyerProduct(orderNumber: string | null) {
  const { data, isLoading, error } = useSWR(
    orderNumber === null ? null : ["buyer-product", orderNumber],
    ([, order]) => fetchBuyerProduct(order),
  );
  return { product: data, isLoading, isError: Boolean(error) };
}

export function useBuyerInquiryDetail(inquiry: BuyerInquiryViewModel) {
  const { data, isLoading, error, mutate } = useSWR(
    ["buyer-inquiry-detail", inquiry.source, inquiry.inquiryIdx],
    () =>
      fetchBuyerInquiryDetail(
        inquiry.inquiryIdx,
        inquiry.source === "qna" ? "PRODUCT_QNA" : "PURCHASER_QUESTION",
      ),
  );
  return { detail: data, isLoading, isError: Boolean(error), mutate };
}

/**
 * 구매자 문의 대화(`GET /v3/help/thread?type=client`: 구매자↔광고주). 스레드 여럿의 메시지를 시간순으로 이어 붙임.
 * 명세상 404는 대화 내역이 없는 경우라 빈 목록으로 봄.
 */
export async function fetchPurchaserConversation(
  threadUserIdx: number,
  campaignIdx: number | null,
) {
  try {
    const response = await serverApiV3.get("/help/thread", {
      params: {
        threadUserIdx,
        type: "client",
        ...(campaignIdx === null ? {} : { campaignIdx }),
      },
    });
    const { data } = ensureSucceeded(inquiryThreadListSchema.parse(response));
    const threads = data.map(transformInquiryThreadToViewModel);
    return {
      // 상담 기록 패널이 스레드(과거 상담)별로 보여 줌. 오래된 것부터.
      threads: [...threads].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      ),
      messages: threads
        .flatMap((thread) => thread.messages)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      // 답장을 보낼 스레드: 가장 최근에 만들어진 스레드(종료됐으면 서버가 새 스레드를 만들어 보냄).
      latestThreadIdx:
        [...threads].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )[0]?.threadIdx ?? null,
    };
  } catch (error) {
    if (isApiError(error) && error.status === 404)
      return { threads: [], messages: [], latestThreadIdx: null };
    throw error;
  }
}

export function usePurchaserConversation(inquiry: BuyerInquiryViewModel) {
  const { threadUserIdx, campaignIdx } = inquiry;
  const { data, isLoading, error, mutate } = useSWR(
    threadUserIdx === null
      ? null
      : ["purchaser-messages", threadUserIdx, campaignIdx],
    () => fetchPurchaserConversation(threadUserIdx!, campaignIdx),
    // 열어 둔 사이에 온 메시지는 탭으로 돌아올 때 다시 받아 보여 줌(앱 전체 기본은 꺼져 있음).
    { revalidateOnFocus: true },
  );
  return {
    messages: data?.messages,
    /** 같은 구매자와의 과거 상담(스레드)들. 상담 기록 패널에 씀. */
    threads: data?.threads,
    /** 답장을 보낼 스레드. 대화 내역이 없으면 null이라 보낼 수 없음. */
    threadIdx: data?.latestThreadIdx ?? null,
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}

/** 상품 Q&A 상세(`POST /v3/help/qna`, 목록 행의 userIdx + campaignIdx). */
export async function fetchQnaDetail(
  userIdx: number,
  campaignIdx: number | null,
) {
  const response = await serverApiV3.post("/help/qna", {
    userIdx,
    ...(campaignIdx === null ? {} : { campaignIdx }),
  });
  return transformQnaListToViewModel(
    ensureSucceeded(qnaDetailListSchema.parse(response)),
  );
}

export function useQnaDetail(inquiry: BuyerInquiryViewModel) {
  const { userIdx, campaignIdx } = inquiry;
  const { data, isLoading, error, mutate } = useSWR(
    userIdx === null ? null : ["qna-detail", userIdx, campaignIdx],
    () => fetchQnaDetail(userIdx!, campaignIdx),
    { revalidateOnFocus: true },
  );
  return { items: data, isLoading, isError: Boolean(error), mutate };
}

/**
 * Q&A 답변 등록(`POST /v3/help/reply`). 실패는 HTTP 상태 코드로 옴: 404 문의 없음, 409 이미 답변이 있음.
 * 상태 코드는 `ApiError.status`로 구분함.
 */
export async function createQnaReply(inquiryIdx: number, body: string) {
  const response = await serverApiV3.post("/help/reply", { inquiryIdx, body });
  ensureSucceeded(replyResultSchema.parse(response));
}

/** Q&A 답변 수정(`PUT /v3/help/reply`). 구매자가 이미 읽은 답변은 409. */
export async function editQnaReply(replyIdx: number, body: string) {
  const response = await serverApiV3.put("/help/reply", { replyIdx, body });
  ensureSucceeded(simpleResultSchema.parse(response));
}

/** Q&A 답변 삭제(`DELETE /v3/help/reply/{replyIdx}`). 구매자가 이미 읽은 답변은 409. */
export async function deleteQnaReply(replyIdx: number) {
  const response = await serverApiV3.delete(`/help/reply/${replyIdx}`);
  ensureSucceeded(simpleResultSchema.parse(response));
}
