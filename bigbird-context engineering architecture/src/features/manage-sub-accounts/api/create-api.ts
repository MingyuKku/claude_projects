import { serverApiV3 } from "@/shared/api";

export interface CreateSubAccountBody {
  id: string;
  pw: string;
  name: string;
  email: string;
  phone: string;
}

/** `POST /v3/mypage/account/sub`. MASTER·ADMIN만 호출할 수 있음(Sub는 403). */
export function createSubAccount(body: CreateSubAccountBody) {
  return serverApiV3.post("/mypage/account/sub", body);
}
