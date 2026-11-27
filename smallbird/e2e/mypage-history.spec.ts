import { expect, test } from "./support/api";
import { mockMypageAccount, mockMypageMoney } from "./support/mypage";

import type { Page } from "@playwright/test";

// 본문 스크롤은 window가 아니라 <main>이 맡는다(widgets/app-shell useScrollRestoration).
// MO에서 하위 화면(?panel=)이 본문을 대체하는 동작까지 보도록 MO 크기로 띄우고, 높이를 줄여 스크롤할 내용을 만든다.
test.use({ viewport: { width: 390, height: 480 } });

// 가장 짧은 화면(Sub ID 목록 1개)에서도 닿는 위치.
const SCROLLED = 100;

async function scrollMain(page: Page, top: number) {
  const main = page.getByRole("main");
  await main.evaluate((element, value) => {
    element.scrollTop = value;
  }, top);
  // 내용이 짧아 원하는 위치까지 못 내려가면 이후 검증이 의미 없으므로 여기서 실패시킨다.
  await expect.poll(() => mainScrollTop(page)).toBe(top);
}

function mainScrollTop(page: Page) {
  return page.getByRole("main").evaluate((element) => element.scrollTop);
}

test.beforeEach(({ api }) => {
  mockMypageAccount(api);
  mockMypageMoney(api);
});

test("전체 메뉴로 다른 화면에 가면 맨 위에서 시작하고, 뒤로가기로 돌아오면 메뉴는 닫힌 채 떠날 때 위치로 돌아온다", async ({
  page,
}) => {
  await page.goto("/mypage/account");
  await expect(page.getByText("홍길동")).toBeVisible();
  await scrollMain(page, SCROLLED);

  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "빅버드 머니" })
    .click();
  await expect(page).toHaveURL("/mypage/money");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect.poll(() => mainScrollTop(page)).toBe(0);

  await page.goBack();
  await expect(page).toHaveURL("/mypage/account");
  await expect(page.getByText("홍길동")).toBeVisible();
  await expect.poll(() => mainScrollTop(page)).toBe(SCROLLED);
  // 마이페이지 화면들은 셸을 공유해, 닫은 메뉴가 기록 복원으로 다시 열리면 안 된다.
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("탭을 바꾸면 맨 위에서 시작하고, 탭 전환은 기록에 남지 않아 뒤로가기로 이전 화면에 간다", async ({
  page,
}) => {
  await page.goto("/mypage/money");
  await page.goto("/mypage/account");
  await expect(page.getByText("홍길동")).toBeVisible();
  await scrollMain(page, SCROLLED);

  await page.getByRole("tab", { name: "알림 설정" }).click();
  await expect(page).toHaveURL("/mypage/account?tab=notification");
  await expect(
    page.getByRole("heading", { name: "알림톡 알림" }),
  ).toBeVisible();
  await expect.poll(() => mainScrollTop(page)).toBe(0);

  await page.goBack();
  await expect(page).toHaveURL("/mypage/money");
});

test("MO에서 하위 화면을 열면 맨 위에서 시작하고, 뒤로가기로 닫으면 열기 전 위치로 돌아온다", async ({
  page,
}) => {
  await page.goto("/mypage/account?tab=sub");
  await expect(page.getByText("sub01")).toBeVisible();
  await scrollMain(page, SCROLLED);

  await page.getByRole("button", { name: "Sub ID 생성" }).click();
  await expect(page).toHaveURL(/panel=create/);
  await expect(
    page.getByRole("button", { name: "Sub ID 생성하기" }),
  ).toBeVisible();
  await expect.poll(() => mainScrollTop(page)).toBe(0);

  await page.goBack();
  await expect(page.getByText("sub01")).toBeVisible();
  await expect.poll(() => mainScrollTop(page)).toBe(SCROLLED);
});
