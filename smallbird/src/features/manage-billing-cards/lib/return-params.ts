import { z } from "zod";

// 카드 등록은 이니시스 페이지로 이 탭 전체가 갔다가 돌아오므로, 돌아와서 열 화면의 쿼리를 이 탭의 sessionStorage에 둠.
const RETURN_PARAMS_STORAGE_KEY = "billing-card-return-params";

const returnParamsSchema = z.record(z.string(), z.string());

export type ReturnParams = z.infer<typeof returnParamsSchema>;

/** 카드 등록으로 떠나기 전에 돌아와서 넣을 쿼리를 남김. 없으면 지워 앞선 등록의 값이 남지 않게 함. */
export function rememberReturnParams(params: ReturnParams | undefined) {
  try {
    if (params) {
      sessionStorage.setItem(RETURN_PARAMS_STORAGE_KEY, JSON.stringify(params));
    } else {
      sessionStorage.removeItem(RETURN_PARAMS_STORAGE_KEY);
    }
  } catch {
    // 저장이 막힌 브라우저는 돌아와서 카드 추가와 같은 화면으로 감.
  }
}

/** 남겨 둔 쿼리를 꺼내고 지움. 없거나 읽을 수 없으면 null. */
export function takeReturnParams(): ReturnParams | null {
  try {
    const stored = sessionStorage.getItem(RETURN_PARAMS_STORAGE_KEY);
    sessionStorage.removeItem(RETURN_PARAMS_STORAGE_KEY);
    if (stored === null) return null;
    const parsed = returnParamsSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
