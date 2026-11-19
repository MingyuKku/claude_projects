import { expect, masterSession, test } from "./support/api";
import { mockMypageMoney } from "./support/mypage";

// 결제창(이니시스)은 외부 화면이라 다루지 않고, 결제 서버가 돌려보내는 주소로 들어오는 것부터 본다.
// 쿼리 처리 규칙(실패·취소, 쿼리 이름과 무관한 정리, 남길 쿼리)은 features/charge-bigbird-money/model/use-payment-return.test.tsx 가 맡는다.
test("결제를 마치고 isPaid=true로 돌아오면 충전 요청 완료 알럿을 띄우고 결제 쿼리를 지운다", async ({
  api,
  page,
}) => {
  api.json("GET", "/server/v3/sec", masterSession);
  mockMypageMoney(api);

  await page.goto(
    "/mypage/money?isPaid=true&gopaymethod=VBank&accountNumber=1234567890&dueDate=20261106",
  );

  await expect(page.getByText("충전 요청 완료")).toBeVisible();
  await expect(page).toHaveURL("/mypage/money");

  // 새로고침해도 쿼리가 남아 있지 않아 알럿을 다시 띄우지 않는다.
  await page.reload();
  await expect(page.getByRole("heading", { name: "상세 내역" })).toBeVisible();
  await expect(page.getByText("충전 요청 완료")).toBeHidden();
});
