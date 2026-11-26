import { ApiError } from "@/shared/api";

import { createDetailResponse, FAKE_BRANDS } from "./campaign-fixtures";

import type { Json } from "./campaign-fixtures";

// 캠페인 등록 화면 테스트용 가짜 서버. `serverApiV3`의 get·post·put·delete에 연결해 캠페인 생성·조회·단계 저장·재승인·승인 요청 취소·목록·브랜드를
// 서버처럼 상태를 가지고 응답함.

function notFound() {
  return new ApiError(404, { reason: "CAMPAIGN_NOT_FOUND" });
}

function toListItem(detail: Json): Json {
  const info = detail.info as Json;
  return {
    campaignIdx: detail.campaignIdx,
    campaignCode: info.campaignCode,
    serviceType: detail.serviceType,
    productType: detail.productType,
    status: detail.status,
    name: info.name,
    brandName: info.brandName,
    productName: (detail.product as Json).productName,
    startDate: info.startDate,
    endDate: info.endDate,
    demo: detail.demo,
    demoCompleted: detail.demoCompleted,
    campaignType: info.campaignType,
    platform: (detail.influencer as Json).platform,
    createdDate: "2026-11-16 10:00:00",
  };
}

const STEP_SECTIONS: Record<string, string> = {
  product: "product",
  influencer: "influencer",
  "add-ons": "addOns",
  intro: "intro",
  conditions: "conditions",
  "group-buying-conditions": "groupBuyingConditions",
};

export interface CampaignServerFake {
  /** 캠페인을 직접 넣음(번호는 상세 응답의 `campaignIdx`). */
  seed: (detail: Json) => void;
  /** 새 번호로 캠페인을 넣고 그 번호를 돌려줌(`createDetailResponse`에 넘기는 값으로 덮어씀). */
  add: (patch?: Json) => number;
  /** 요청으로 만든 캠페인 번호들. */
  created: () => number[];
  /** 두 번째 인자는 `serverApiV3.get`의 옵션(`{ params }`). */
  get: (path: string, config?: unknown) => Promise<unknown>;
  post: (path: string, body?: Json) => Promise<unknown>;
  put: (path: string, body?: Json) => Promise<unknown>;
  delete: (path: string) => Promise<unknown>;
}

export function createCampaignServerFake(
  firstNewIdx = 100,
): CampaignServerFake {
  const campaigns = new Map<number, Json>();
  const created: number[] = [];
  let sequence = firstNewIdx;

  function find(idx: string | number) {
    const detail = campaigns.get(Number(idx));
    if (!detail) throw notFound();
    return detail;
  }

  function matchCampaign(path: string) {
    return /^\/campaign\/(\d+)(?:\/(.+))?$/.exec(path);
  }

  return {
    seed: (detail) => {
      campaigns.set(detail.campaignIdx as number, detail);
    },
    add: (patch = {}) => {
      const idx = sequence++;
      campaigns.set(idx, createDetailResponse(idx, patch));
      return idx;
    },
    created: () => created,

    async get(path, config) {
      if (path === "/brand") return { brands: FAKE_BRANDS };
      if (path === "/campaign") {
        const params = (config as { params?: Json } | undefined)?.params ?? {};
        const statuses = String(params.status ?? "")
          .split(",")
          .filter(Boolean);
        const list = [...campaigns.values()]
          .filter(
            (detail) =>
              statuses.length === 0 ||
              statuses.includes(detail.status as string),
          )
          .filter(
            (detail) =>
              !params.serviceType || detail.serviceType === params.serviceType,
          )
          .filter(
            (detail) =>
              !params.productType || detail.productType === params.productType,
          )
          .filter((detail) => detail.campaignIdx !== params.excludeCampaignIdx)
          .filter((detail) => {
            const keyword = String(params.keyword ?? "");
            return (
              !keyword ||
              String((detail.info as Json).name ?? "").includes(keyword)
            );
          })
          .sort((a, b) => (b.campaignIdx as number) - (a.campaignIdx as number))
          .map(toListItem);
        return {
          list,
          count: list.length,
          currentPage: 1,
          entrySize: 100,
        };
      }
      const match = matchCampaign(path);
      if (match && !match[2]) return find(match[1] as string);
      throw new Error(`unmocked GET ${path}`);
    },

    async post(path, body = {}) {
      if (path === "/campaign") {
        const idx = sequence++;
        created.push(idx);
        const detail = createDetailResponse(idx, {
          serviceType: body.serviceType,
          productType: body.productType,
          demo: body.demo,
        });
        campaigns.set(idx, detail);
        return {
          campaignIdx: idx,
          campaignCode: (detail.info as Json).campaignCode,
        };
      }
      const match = matchCampaign(path);
      if (match?.[2] === "copy") {
        const target = find(match[1] as string);
        const source = find(body.sourceCampaignIdx as number);
        const { info } = source as { info: Json };
        campaigns.set(target.campaignIdx as number, {
          ...source,
          campaignIdx: target.campaignIdx,
          status: target.status,
          demo: target.demo,
          demoCompleted: target.demoCompleted,
          policy: null,
          payment: null,
          info: { ...info, campaignCode: (target.info as Json).campaignCode },
        });
        return undefined;
      }
      if (match?.[2] === "approval") {
        const target = find(match[1] as string);
        const agreements = (body.agreements ?? {}) as Record<string, boolean>;
        if (
          !["service", "privacy", "operation", "reward"].every(
            (k) => agreements[k],
          )
        ) {
          throw new ApiError(400, { reason: "POLICY_NOT_AGREED" });
        }
        if (target.status !== "REJECTED") {
          throw new ApiError(409, {
            reason: "NOT_REQUESTABLE",
            status: target.status,
          });
        }
        target.status = "REVIEWING";
        target.rejectReason = null;
        target.policy = { agreements };
        return { status: "REVIEWING" };
      }
      if (match?.[2] === "payment/cancel") {
        const target = find(match[1] as string);
        target.status = "DRAFT";
        target.payment = null;
        return { status: "DRAFT", refundedAmount: 0, balance: 0 };
      }
      if (match?.[2] === "demo/complete") {
        find(match[1] as string).demoCompleted = true;
        return undefined;
      }
      throw new Error(`unmocked POST ${path}`);
    },

    async put(path, body = {}) {
      const match = matchCampaign(path);
      if (!match?.[2]) throw new Error(`unmocked PUT ${path}`);
      const target = find(match[1] as string);
      const step = match[2];
      if (step === "info") {
        const info = target.info as Json;
        target.info = {
          ...info,
          name: body.name ?? null,
          brandIdx: body.brandIdx ?? null,
          brandName:
            FAKE_BRANDS.find((brand) => brand.brandIdx === body.brandIdx)
              ?.name ?? null,
          campaignType: body.campaignType ?? null,
          startDate: body.startDate ?? null,
          endDate: body.startDate ? "2099-12-31" : null,
        };
        return { endDate: (target.info as Json).endDate };
      }
      const section = STEP_SECTIONS[step];
      if (!section) throw new Error(`unmocked PUT ${path}`);
      target[section] = step === "add-ons" ? (body.addOns ?? []) : { ...body };
      return undefined;
    },

    async delete(path) {
      const match = matchCampaign(path);
      if (!match) throw new Error(`unmocked DELETE ${path}`);
      campaigns.delete(Number(match[1]));
      return undefined;
    },
  };
}
