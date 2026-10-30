import { useSearchParams } from "react-router";
import useSWR from "swr";

import { parsePageParam } from "../lib/page-param";
import { PAGE_PARAM } from "../model/constants";
import { fetchChargeList } from "./charge-api";

const CHARGE_KEY = ["mypage", "biz-money", "charge"];

/** 충전 내역 한 쪽. 쪽을 넘기는 동안에는 이전 쪽을 그대로 보여 깜빡이지 않게 함. */
export function useChargeHistory(page: number) {
  const { data, error, isLoading, mutate } = useSWR(
    [...CHARGE_KEY, page],
    () => fetchChargeList(page),
    { keepPreviousData: true },
  );
  return { list: data, isLoading, isError: Boolean(error), mutate };
}

/**
 * 거래 상세로 연 충전 내역 한 건. 지금 보고 있는 쪽(쪽 쿼리)의 목록에서 순서(`id`)로 찾으므로
 * 목록과 같은 요청을 씀. 목록에 없으면 null이라 호출하는 쪽이 열지 않음.
 */
export function useChargeRecord(id: string | null) {
  const [searchParams] = useSearchParams();
  const page = parsePageParam(searchParams.get(PAGE_PARAM));
  const { list } = useChargeHistory(page);
  if (id === null) return null;
  return list?.records.find((record) => record.id === id) ?? null;
}
