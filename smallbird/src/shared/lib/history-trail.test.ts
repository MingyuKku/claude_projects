import { createMemoryRouter } from "react-router";

import { getStepsBackTo, trackHistoryTrail } from "./history-trail";

function setup(initialEntries = ["/a"]) {
  const router = createMemoryRouter([{ path: "*", element: null }], {
    initialEntries,
    initialIndex: initialEntries.length - 1,
  });
  const unsubscribe = trackHistoryTrail(router);
  const currentKey = () => router.state.location.key;
  return { router, currentKey, unsubscribe };
}

describe("방문 기록 칸 수", () => {
  it("새로 이동한 만큼 뒤로 칸 수를 센다", async () => {
    const { router, currentKey } = setup();
    const first = currentKey();
    await router.navigate("/b");
    const second = currentKey();
    await router.navigate("/c");

    expect(getStepsBackTo(first)).toBe(2);
    expect(getStepsBackTo(second)).toBe(1);
    expect(getStepsBackTo(currentKey())).toBeNull();
  });

  it("주소를 바꿔 끼운(replace) 기록은 칸 수를 늘리지 않고, 바뀌기 전 항목은 찾지 않는다", async () => {
    const { router, currentKey } = setup();
    const first = currentKey();
    await router.navigate("/b");
    const replaced = currentKey();
    await router.navigate("/b2", { replace: true });

    expect(getStepsBackTo(first)).toBe(1);
    expect(getStepsBackTo(replaced)).toBeNull();
  });

  it("뒤로 간 뒤에는 그 자리에서 세고, 앞쪽 기록은 뒤로 칸 수로 세지 않는다", async () => {
    const { router, currentKey } = setup();
    const first = currentKey();
    await router.navigate("/b");
    await router.navigate("/c");
    const third = currentKey();
    await router.navigate(-1);

    expect(getStepsBackTo(first)).toBe(1);
    expect(getStepsBackTo(third)).toBeNull();
  });

  it("뒤로 간 자리에서 새로 이동하면 앞쪽 기록은 버린다", async () => {
    const { router, currentKey } = setup();
    await router.navigate("/b");
    const dropped = currentKey();
    await router.navigate(-1);
    await router.navigate("/c");
    await router.navigate("/d");

    expect(getStepsBackTo(dropped)).toBeNull();
  });

  it("추적하기 전의 기록(새로고침 앞)으로 돌아가면 그 자리부터 다시 센다", async () => {
    const { router, currentKey } = setup(["/before", "/a"]);
    await router.navigate(-1);
    const before = currentKey();
    await router.navigate("/c");

    expect(getStepsBackTo(before)).toBe(1);
  });
});
