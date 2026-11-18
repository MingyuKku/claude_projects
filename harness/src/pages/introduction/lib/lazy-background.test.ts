import { createLazyBackground } from "./lazy-background";

const ROOT_BOTTOM = 800;
const ROOT_HEIGHT = 800;
// 스크롤 컨테이너 아래로 컨테이너 높이의 1.5배(lazy-background.ts 의 PRELOAD_VIEWPORTS)까지가 미리 받는 범위.
const PRELOAD_LINE = ROOT_BOTTOM + ROOT_HEIGHT * 1.5;

function createRoot(): HTMLElement {
  const root = document.createElement("div");
  Object.defineProperty(root, "clientHeight", { value: ROOT_HEIGHT });
  root.getBoundingClientRect = () => ({ bottom: ROOT_BOTTOM }) as DOMRect;
  return root;
}

function appendLazyElement(root: HTMLElement, top: number): HTMLElement {
  const element = document.createElement("div");
  element.setAttribute("data-lazy-bg", "");
  element.getBoundingClientRect = () => ({ top }) as DOMRect;
  root.appendChild(element);
  return element;
}

describe("createLazyBackground", () => {
  it("미리 받는 범위 안에 들어온 요소에만 data-bg-ready 를 붙인다", () => {
    const root = createRoot();
    const near = appendLazyElement(root, ROOT_BOTTOM);
    const far = appendLazyElement(root, PRELOAD_LINE + 1);

    createLazyBackground(root).check();

    expect(near).toHaveAttribute("data-bg-ready");
    expect(far).not.toHaveAttribute("data-bg-ready");
  });

  it("범위 경계(PRELOAD_LINE) 바로 안쪽은 켜고 경계에 닿은 요소는 아직 켜지 않는다", () => {
    const root = createRoot();
    const justInside = appendLazyElement(root, PRELOAD_LINE - 1);
    const onLine = appendLazyElement(root, PRELOAD_LINE);

    createLazyBackground(root).check();

    expect(justInside).toHaveAttribute("data-bg-ready");
    expect(onLine).not.toHaveAttribute("data-bg-ready");
  });

  it("이미 화면 위로 지나간 요소도 켠다 (큰 스크롤 점프)", () => {
    const root = createRoot();
    const passed = appendLazyElement(root, -5000);

    createLazyBackground(root).check();

    expect(passed).toHaveAttribute("data-bg-ready");
  });

  it("스크롤로 가까워지면 그때 켜고, 한 번 켠 요소는 되돌리지 않는다", () => {
    const root = createRoot();
    let top = PRELOAD_LINE + 500;
    const element = appendLazyElement(root, top);
    element.getBoundingClientRect = () => ({ top }) as DOMRect;
    const lazyBackground = createLazyBackground(root);

    lazyBackground.check();
    expect(element).not.toHaveAttribute("data-bg-ready");

    top = ROOT_BOTTOM;
    lazyBackground.check();
    expect(element).toHaveAttribute("data-bg-ready");

    top = PRELOAD_LINE + 500;
    lazyBackground.check();
    expect(element).toHaveAttribute("data-bg-ready");
  });

  it("켠 요소는 다시 재지 않는다", () => {
    const root = createRoot();
    const element = appendLazyElement(root, ROOT_BOTTOM);
    const measure = vi.fn(() => ({ top: ROOT_BOTTOM }) as DOMRect);
    element.getBoundingClientRect = measure;
    const lazyBackground = createLazyBackground(root);

    lazyBackground.check();
    lazyBackground.check();

    expect(measure).toHaveBeenCalledTimes(1);
  });

  it("root 가 없거나 대상이 없으면 아무 일도 하지 않는다", () => {
    expect(() => createLazyBackground(null).check()).not.toThrow();
    expect(() => createLazyBackground(createRoot()).check()).not.toThrow();
  });
});
