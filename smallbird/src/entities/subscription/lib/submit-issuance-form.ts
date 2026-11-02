import type { IssuanceForm } from "../model/types";

/**
 * 결제 서버가 준 값을 숨은 form에 채워 결제창 주소로 POST함(전체 화면 이동). 팝업이 아니라 이 탭이 이니시스 페이지로 넘어가고,
 * 결제가 끝나면 서버가 `redirectUri`로 돌려보냄. 이동하므로 form을 따로 지우지 않음.
 */
export function submitIssuanceForm({ action, fields }: IssuanceForm) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.acceptCharset = "UTF-8";
  form.hidden = true;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.append(input);
  }
  document.body.append(form);
  form.submit();
}
