import { z } from "zod";

/** `GET /v3/mypage/account/bank/list`. 계좌 등록(계정 설정)과 빅버드 머니 출금이 같은 목록을 씀. */
export const bankListSchema = z.object({
  bankList: z.array(z.object({ idx: z.number(), name: z.string() })),
});

export interface BankOption {
  idx: number;
  name: string;
}

/**
 * 계좌번호 입력란의 최대 글자 수(하이픈 포함). 국내 계좌번호는 보통 10~16자리라 여유를 둔 상한이며,
 * 백엔드가 정한 한도가 아님. 상세 화면에서 값이 길어 줄바꿈되는 일을 입력 단계에서 줄임.
 */
export const ACCOUNT_NUMBER_MAX_LENGTH = 20;
