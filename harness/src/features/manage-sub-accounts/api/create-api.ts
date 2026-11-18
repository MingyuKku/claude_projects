import { serverApiV3 } from "@/shared/api";

export interface CreateSubAccountBody {
  id: string;
  pw: string;
  name: string;
  email: string;
}

/**
 * `POST /v3/mypage/account/sub`. MASTER·ADMIN만 호출할 수 있음(Sub는 403).
 * multipart 요청이라 계정 정보는 JSON 파트(`request`), 프로필 이미지는 선택 파트(`profileImage`)로 보냄.
 */
export function createSubAccount(
  body: CreateSubAccountBody,
  profileImage: File | null,
) {
  return serverApiV3.post(
    "/mypage/account/sub",
    toMultipart(body, profileImage),
  );
}

/** 수정 요청. 바꾼 필드만 담으며, 비어 있는 필드는 서버가 그대로 둠(부분 수정). */
export type UpdateSubAccountBody = Partial<CreateSubAccountBody>;

/**
 * `PATCH /v3/mypage/account/sub/{accountIdx}`. Master가 자기 회사 Sub ID를 고침(다른 회사는 403).
 * 아이디나 비밀번호를 바꾸면 그 Sub ID는 서버에서 로그아웃됨. 아이디 중복은 400 `existing id`.
 */
export function updateSubAccount(
  accountIdx: number,
  body: UpdateSubAccountBody,
  profileImage: File | null,
) {
  return serverApiV3.patch(
    `/mypage/account/sub/${accountIdx}`,
    toMultipart(body, profileImage),
  );
}

function toMultipart(body: object, profileImage: File | null) {
  const form = new FormData();
  form.append(
    "request",
    new Blob([JSON.stringify(body)], { type: "application/json" }),
  );
  if (profileImage) form.append("profileImage", profileImage);
  return form;
}
