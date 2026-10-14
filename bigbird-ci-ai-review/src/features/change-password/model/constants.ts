export const CHANGE_PASSWORD_SUCCESS_RESULT = "success";
export const PASSWORD_MAX_LENGTH = 20;

export const SUBMIT_REQUIRED_MESSAGE = "비밀번호를 입력해주세요";

export const CHANGE_ERROR_MESSAGES = {
  containsId:
    "사용자 아이디와 동일하거나 이를 포함한 비밀번호는 사용을 금지합니다",
  containsPersonalInfo: "개인 신상정보를 포함한 비밀번호는 사용을 금지합니다",
  timeOut: "비밀번호 변경에 실패하였습니다(5분 내에 비밀번호를 바꿔주세요)",
  fallback: "비밀번호 변경에 실패하였습니다",
} as const;
