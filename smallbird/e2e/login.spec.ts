import { expect, masterSession, test } from "./support/api";

test("아이디로 로그인하면 홈으로 이동해 로그인 헤더와 LNB를 보여 준다", async ({
  api,
  page,
}) => {
  let loggedIn = false;
  api.on("GET", "/server/v3/sec", (route) =>
    loggedIn
      ? route.fulfill({ json: masterSession })
      : route.fulfill({ status: 401, json: { result: false } }),
  );
  api.on("POST", "/server/login", (route) => {
    loggedIn = true;
    return route.fulfill({
      json: { result: true, authority: "MASTER", userIdx: 1 },
    });
  });

  await page.goto("/login");
  await page.getByLabel("아이디").fill("tester");
  await page.getByLabel("비밀번호", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "홈" })).toBeVisible();
  await expect(page.getByRole("button", { name: "내 프로필" })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "주 메뉴" })
      .getByRole("link", { name: "홈" }),
  ).toHaveAttribute("aria-current", "page");
});
