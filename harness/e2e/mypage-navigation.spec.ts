import { expect, masterSession, test } from "./support/api";

test("홈에서 프로필 메뉴로 계정 설정에 들어가고 브라우저 뒤로가기로 홈에 돌아온다", async ({
  api,
  page,
}) => {
  api.json("GET", "/server/v3/sec", masterSession);
  api.json("GET", "/server/v3/mypage/account/master", {
    result: true,
    user: {
      identifier: "tester",
      email: "test@example.com",
      certification: { certIdx: 1, name: "홍길동", phoneNumber: "01012345678" },
      created: "2024-01-01 10:00",
    },
  });

  await page.goto("/");
  await page.getByRole("button", { name: "내 프로필" }).click();
  await page.getByRole("menuitem", { name: "계정 설정" }).click();

  await expect(page).toHaveURL("/mypage/account");
  await expect(page.getByRole("heading", { name: "계정 설정" })).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Master ID 관리", selected: true }),
  ).toBeVisible();
  await expect(page.getByText("홍길동")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "홈" })).toBeVisible();
});
