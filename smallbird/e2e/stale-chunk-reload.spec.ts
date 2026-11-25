import { expect, test } from "./support/api";
import { mockMypageAccount } from "./support/mypage";

import type { Page } from "@playwright/test";

// 배포 전에 연 탭이 새 배포에서 지워진 화면 코드를 요청하는 상황을, 계정 설정 화면 코드 요청을 404로 돌려 재현한다.
const ACCOUNT_PAGE_CHUNK = /\/assets\/mypage-account-[\w-]+\.js$/;

test.beforeEach(({ api }) => {
  mockMypageAccount(api);
});

async function openAccountSettingsFromHome(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "내 프로필" }).click();
  await page.getByRole("menuitem", { name: "계정 설정" }).click();
}

test("이동할 화면 코드를 받지 못하면 그 화면 주소로 새로고침해 화면을 연다", async ({
  page,
}) => {
  let failed = false;
  await page.route(ACCOUNT_PAGE_CHUNK, (route) => {
    if (failed) return route.continue();
    failed = true;
    return route.fulfill({ status: 404 });
  });

  await openAccountSettingsFromHome(page);

  await expect(page).toHaveURL("/mypage/account");
  await expect(page.getByRole("heading", { name: "계정 설정" })).toBeVisible();
});

test("새로고침한 뒤에도 화면 코드를 받지 못하면 새로고침을 반복하지 않고 에러 화면을 보여 준다", async ({
  page,
}) => {
  let documentLoads = 0;
  page.on("load", () => {
    documentLoads += 1;
  });
  await page.route(ACCOUNT_PAGE_CHUNK, (route) =>
    route.fulfill({ status: 404 }),
  );

  await openAccountSettingsFromHome(page);

  await expect(page).toHaveURL("/mypage/account");
  await expect(
    page.getByRole("heading", { name: "문제가 발생했습니다" }),
  ).toBeVisible();
  // 첫 진입과 한 번의 새로고침.
  expect(documentLoads).toBe(2);
});

test("새로고침 시각을 저장할 수 없으면 빈 화면 대신 에러 화면과 다시 시도 버튼을 보여 준다", async ({
  page,
}) => {
  // 저장 공간 초과처럼 읽기는 되고 쓰기만 실패하는 환경.
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === window.sessionStorage) {
        throw new DOMException("quota", "QuotaExceededError");
      }
      return setItem.call(this, key, value);
    };
  });
  await page.route(ACCOUNT_PAGE_CHUNK, (route) =>
    route.fulfill({ status: 404 }),
  );

  await openAccountSettingsFromHome(page);

  await expect(
    page.getByRole("heading", { name: "문제가 발생했습니다" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
});
