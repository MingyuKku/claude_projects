import { expect, masterSession, test } from "./support/api";
import { mockMypageAccount } from "./support/mypage";

// 로그아웃·계정 전환은 이전 계정의 서버 캐시와 진행 중 요청을 버리려고 페이지를 새로 불러온다(shared/lib hardNavigate).
// jsdom은 페이지를 새로 불러올 수 없어 이 흐름은 여기서만 확인한다.

test("세션이 만료된 채 계정 설정에 들어가면 로그인으로 가고, 로그인한 뒤에는 계정 설정에 들어갈 수 있다", async ({
  api,
  page,
}) => {
  mockMypageAccount(api);
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

  await page.goto("/mypage/account");
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("아이디").fill("tester");
  await page.getByLabel("비밀번호", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL("/");

  // 만료 때 거부된 화면이라도 로그인 뒤 첫 진입은 세션을 다시 확인해 들어간다.
  await page.getByRole("button", { name: "내 프로필" }).click();
  await page.getByRole("menuitem", { name: "계정 설정" }).click();
  await expect(page).toHaveURL("/mypage/account");
  await expect(page.getByText("홍길동")).toBeVisible();
});

test("로그아웃하면 홈을 새로 불러와 비로그인 헤더를 보여 준다", async ({
  api,
  page,
}) => {
  let loggedIn = true;
  api.on("GET", "/server/v3/sec", (route) =>
    loggedIn
      ? route.fulfill({ json: masterSession })
      : route.fulfill({ status: 401, json: { result: false } }),
  );
  api.on("POST", "/server/v3/auth/logout", (route) => {
    loggedIn = false;
    return route.fulfill({ json: { result: true } });
  });

  await page.goto("/mypage/account");
  await expect(page.getByRole("heading", { name: "계정 설정" })).toBeVisible();

  await page.getByRole("button", { name: "내 프로필" }).click();
  const reloaded = page.waitForEvent("load");
  await page.getByRole("menuitem", { name: "로그아웃" }).click();
  await reloaded;

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  await expect(page.getByRole("button", { name: "내 프로필" })).toBeHidden();
});

test("관리자가 계정을 전환하면 전환이 끝날 때까지 다른 계정을 막고, 끝나면 홈을 새로 불러온다", async ({
  api,
  page,
}) => {
  let authority = "ADMIN";
  api.on("GET", "/server/v3/sec", (route) =>
    route.fulfill({ json: { ...masterSession, authority } }),
  );
  api.json("GET", "/server/super", {
    clientList: [
      { id: "sample-master", user_idx: 42, company_name: null },
      { id: "bigbird", user_idx: 1, company_name: "빅버드" },
    ],
  });
  api.json("POST", "/server/v3/help/firebase-token/revoke", { result: true });
  let finishSwitch: () => void = () => {};
  const switchRequested = new Promise<void>((resolve) => {
    api.on("POST", "/server/super/change", (route) => {
      expect(route.request().postDataJSON()).toEqual({ userIdx: 42 });
      resolve();
      // 응답을 붙잡아 전환 중 상태를 확인한 뒤 성공으로 끝낸다.
      finishSwitch = () => {
        authority = "MASTER";
        void route.fulfill({ json: { result: true } });
      };
    });
  });

  await page.goto("/");
  await page.getByRole("link", { name: "빅버드 · 아이디 변경" }).click();
  await expect(page).toHaveURL("/a/change");

  await page
    .getByRole("button", { name: "sample-master 계정으로 변경" })
    .click();
  await switchRequested;
  await expect(
    page.getByRole("button", { name: "bigbird 계정으로 변경" }),
  ).toBeDisabled();

  const reloaded = page.waitForEvent("load");
  finishSwitch();
  await reloaded;

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "홈" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "빅버드 · 아이디 변경" }),
  ).toBeHidden();
});
