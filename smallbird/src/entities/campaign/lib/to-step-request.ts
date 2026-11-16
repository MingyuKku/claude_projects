import type {
  CampaignAddress,
  CampaignDraft,
  CampaignDraftStep,
  CampaignMedia,
} from "../model/draft";

// 단계별 수정(A-5.x) 요청 본문. 서버는 단계 단위로 덮어써서 보내지 않거나 null인 칸을 비우므로, 입력 전 값은 null로 보냄.

function textOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toAddressRequest(address: CampaignAddress | null) {
  if (!address) return null;
  return {
    zonecode: address.zonecode,
    address: address.address,
    detail: textOrNull(address.detail),
  };
}

function toAttachmentRequest(media: CampaignMedia) {
  return { attachmentIdx: media.attachmentIdx };
}

const EMPTY_PRODUCT_REQUEST = {
  productName: null,
  quantityPerInfluencer: null,
  productPrice: null,
  returnAddress: null,
  returnShippingFee: null,
  returnContact: null,
  rentalReturnAddress: null,
  rentalReturnShippingFee: null,
  rentalReturnContact: null,
  storeName: null,
  storeAddress: null,
  visitCouponCode: null,
  visitBenefit: null,
};

/** 유형에 맞는 칸만 채우고 나머지는 null(A-5.2). 회수·대여를 고르지 않았으면 그 칸도 비움. */
function toProductRequest({ info, product }: CampaignDraft) {
  if (info.campaignType === "PRODUCT_DELIVERY") {
    return {
      ...EMPTY_PRODUCT_REQUEST,
      productName: textOrNull(product.productName),
      quantityPerInfluencer: product.quantityPerInfluencer,
      productPrice: product.productPrice,
      ...(product.returnRequired && {
        returnAddress: toAddressRequest(product.returnAddress),
        returnShippingFee: product.returnShippingFee,
        returnContact: textOrNull(product.returnContact),
      }),
      ...(product.rental && {
        rentalReturnAddress: toAddressRequest(product.rentalReturnAddress),
        rentalReturnShippingFee: product.rentalReturnShippingFee,
        rentalReturnContact: textOrNull(product.rentalReturnContact),
      }),
    };
  }
  if (info.campaignType === "STORE_VISIT") {
    return {
      ...EMPTY_PRODUCT_REQUEST,
      storeName: textOrNull(product.storeName),
      storeAddress: toAddressRequest(product.storeAddress),
      visitCouponCode: textOrNull(product.visitCouponCode),
      visitBenefit: textOrNull(product.visitBenefit),
    };
  }
  return EMPTY_PRODUCT_REQUEST;
}

const RAW_STEP_REQUEST_BUILDERS = {
  info: ({ info }: CampaignDraft) => ({
    name: textOrNull(info.name),
    brandIdx: info.brandIdx,
    campaignType: info.campaignType,
    startDate: info.startDate,
  }),
  product: toProductRequest,
  influencer: ({ influencer }: CampaignDraft) => ({ ...influencer }),
  addOns: ({ addOns }: CampaignDraft) => ({ addOns }),
  intro: ({ intro }: CampaignDraft) => ({
    mainImage: intro.mainImage ? toAttachmentRequest(intro.mainImage) : null,
    // v2 영상 주소 항목은 번호가 없어 보낼 수 없음(API가 videoUrl을 받지 않음).
    detailMedia: intro.detailMedia
      .filter((media) => media.attachmentIdx !== null)
      .map(toAttachmentRequest),
    description: textOrNull(intro.description),
    notice: textOrNull(intro.notice),
    titleHashtags: intro.titleHashtags,
    contentHashtags: intro.contentHashtags,
  }),
  conditions: ({ conditions }: CampaignDraft) => ({ ...conditions }),
  policy: ({ policy }: CampaignDraft) => ({ agreements: { ...policy } }),
} satisfies Record<CampaignDraftStep, (draft: CampaignDraft) => object>;

export type CampaignStepRequests = {
  [S in CampaignDraftStep]: ReturnType<(typeof RAW_STEP_REQUEST_BUILDERS)[S]>;
};

// 단계 키와 반환 타입을 짝지은 모양으로 다시 적어야 제네릭 `step`으로 꺼낸 함수의 반환 타입이 맞춰짐.
const STEP_REQUEST_BUILDERS: {
  [S in CampaignDraftStep]: (draft: CampaignDraft) => CampaignStepRequests[S];
} = RAW_STEP_REQUEST_BUILDERS;

export function toStepRequest<S extends CampaignDraftStep>(
  step: S,
  draft: CampaignDraft,
): CampaignStepRequests[S] {
  return STEP_REQUEST_BUILDERS[step](draft);
}
