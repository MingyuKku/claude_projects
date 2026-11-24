import { act, fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it } from "vitest";

import { Toaster } from "./sonner";

// 토스트를 띄우고, 컨테이너(ol)에 mouseenter가 와서 펼쳐진 상태까지 만듦.
// iOS는 탭하면 mouseenter(mouseover)만 보내므로 그 흐름을 재현함.
async function renderExpandedToast() {
  render(<Toaster />);
  act(() => {
    toast("테스트 토스트", { id: "test", duration: Infinity });
  });
  const message = await screen.findByText("테스트 토스트");
  const item = message.closest("[data-sonner-toast]") as HTMLElement;
  const toaster = item.closest("[data-sonner-toaster]") as HTMLElement;
  expect(item).toHaveAttribute("data-expanded", "false");
  fireEvent.mouseEnter(toaster);
  expect(item).toHaveAttribute("data-expanded", "true");
  return { item };
}

// sonner는 토스트를 누를 때 setPointerCapture를 부르는데 jsdom에는 없음.
Element.prototype.setPointerCapture ??= () => {};

afterEach(() => {
  act(() => {
    toast.dismiss();
  });
});

describe("Toaster 터치 보정", () => {
  it("iOS처럼 탭으로 펼쳐진 뒤에는 토스트 바깥을 터치해야 접힌다", async () => {
    const { item } = await renderExpandedToast();

    fireEvent.pointerDown(document.body, { pointerType: "touch" });

    expect(item).toHaveAttribute("data-expanded", "false");
  });

  it("토스트 안쪽을 터치하면 접히지 않는다", async () => {
    const { item } = await renderExpandedToast();

    fireEvent.pointerDown(item, { pointerType: "touch" });

    expect(item).toHaveAttribute("data-expanded", "true");
  });

  it("마우스로 바깥을 눌러도 보정하지 않는다(마우스는 벗어날 때 mouseleave가 옴)", async () => {
    const { item } = await renderExpandedToast();

    fireEvent.pointerDown(document.body, { pointerType: "mouse" });

    expect(item).toHaveAttribute("data-expanded", "true");
  });

  it("마우스를 올렸다 벗어나면 기존처럼 접힌다", async () => {
    const { item } = await renderExpandedToast();

    fireEvent.mouseLeave(item.closest("[data-sonner-toaster]") as HTMLElement);

    expect(item).toHaveAttribute("data-expanded", "false");
  });
});
