import { expect, masterSession, test } from "./support/api";

import type { Page } from "@playwright/test";

// 문의 대화는 Firestore를 쓰므로 밖으로 나가지 않게 막는다. 이 흐름은 화면 이동만 본다.
test.beforeEach(async ({ api, page }) => {
  api.json("GET", "/server/v3/sec", masterSession);
  await page.route(/googleapis\.com/, (route) => route.abort());
});

// 도착 화면은 데이터에 따라 바뀌는 본문 대신 화면의 정체(경로, 문서 제목, LNB 현재 위치)로 확인한다.
async function expectCustomerCenterPage(
  page: Page,
  { path, title }: { path: string; title: string },
) {
  await expect(page).toHaveURL(path);
  await expect(page).toHaveTitle(title);
  await expect(
    page
      .getByRole("navigation", { name: "주 메뉴" })
      .getByRole("link", { name: title }),
  ).toHaveAttribute("aria-current", "page");
}

test("LNB로 빅버드 문의에서 구매자 문의로 옮긴 뒤 뒤로가기로 빅버드 문의 화면과 선택 메뉴가 돌아온다", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "주 메뉴" });
  // 홈에서는 고객센터 그룹이 접혀 있어 먼저 펼친다.
  await nav.getByText("고객센터", { exact: true }).click();
  await nav.getByRole("link", { name: "빅버드 문의" }).click();
  await expectCustomerCenterPage(page, {
    path: "/customer-center/bigbird",
    title: "빅버드 문의",
  });

  await nav.getByRole("link", { name: "구매자 문의" }).click();
  await expectCustomerCenterPage(page, {
    path: "/customer-center/buyer",
    title: "구매자 문의",
  });

  await page.goBack();
  await expectCustomerCenterPage(page, {
    path: "/customer-center/bigbird",
    title: "빅버드 문의",
  });
});
