import { Loader2Icon, XIcon } from "lucide-react"
import { useEffect } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// Figma 디자인 시스템 Toast(6706:10632) 기준.
// 기본(default·success·info·warning) = slate/600 배경, 오류(error) = Destructive. Figma 토스트에는 유형 아이콘이 없어
// 로딩 스피너만 보임. 정적 미리보기(ToastCard)도 같은 클래스를 쓰도록 toastStyles로 내보냄.
const toastStyles = {
  toast:
    "group/toast flex items-center gap-4 rounded-md bg-slate-600 py-6 pr-8 pl-6 text-sm leading-5 text-primary-foreground shadow-lg data-[type=error]:border data-[type=error]:border-destructive data-[type=error]:bg-destructive data-[type=error]:text-destructive-foreground",
  icon: "hidden group-data-[type=loading]/toast:flex",
  content: "flex min-w-0 flex-1 flex-col gap-1",
  title: "font-semibold",
  description: "opacity-90",
  actionButton:
    "inline-flex min-w-15 shrink-0 cursor-pointer items-center justify-center rounded-md border border-muted/40 px-3 py-1 text-sm leading-6 font-medium text-current outline-none hover:bg-secondary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-data-[type=error]/toast:bg-destructive group-data-[type=error]/toast:hover:bg-destructive group-data-[type=error]/toast:hover:text-destructive-foreground group-data-[type=error]/toast:focus-visible:ring-destructive",
  // 닫기 버튼은 Figma 시안대로 hover·포커스에서만 보임. hover가 없는 터치 기기에서는 닫을 방법이 없어
  // 항상 보이게 함(사용자 요청).
  closeButton:
    "absolute top-0.75 right-0.75 flex cursor-pointer items-center justify-center rounded-sm p-1 text-primary-foreground opacity-0 outline-none group-hover/toast:opacity-100 [@media(hover:none)]:opacity-100 focus-visible:bg-accent/50 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-data-[type=error]/toast:bg-destructive group-data-[type=error]/toast:focus-visible:ring-destructive",
}

// unstyled 모드에서는 sonner가 토스트 폭을 정하지 않아 내용 폭으로 줄어듦. 컨테이너 폭(--width)을 채움.
// toastStyles.toast는 정적 미리보기(ToastCard)도 써서 폭 클래스는 여기서만 더함.
const toasterClassNames = {
  ...toastStyles,
  toast: `${toastStyles.toast} w-full`,
}

// Figma Toast + Paddings: 토스트 폭 388, 화면 가장자리 여백 16.
const TOAST_WIDTH = "388px"
const TOAST_OFFSET = 16

const TOASTER_SELECTOR = "[data-sonner-toaster]"
const EXPANDED_TOAST_SELECTOR = `${TOASTER_SELECTOR} [data-sonner-toast][data-expanded="true"]`

// iOS Safari는 탭한 요소를 hover 상태로 두고 다른 클릭 가능한 요소를 탭하기 전에는 mouseout·mouseleave를 보내지 않음
// (Apple "Safari Web Content Guide: Handling Events", WebKit 158517). sonner는 mouseenter로 토스트를 펼치며 타이머를 멈추고
// mouseleave로만 접어서, 터치로 펼치면 계속 펼쳐진 채 자동으로 사라지지 않음. 그래서 토스트 바깥을 터치하면
// mouseout을 대신 보내 접음(React가 mouseout에서 onMouseLeave를 만듦). 마우스·펜 입력과 토스트 안쪽 터치는 건드리지 않음.
// sonner나 React를 올리면 sonner.test.tsx와 iOS 실기기에서 다시 확인할 것.
function useCollapseOnOutsideTouch() {
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType !== "touch") return
      const toaster = document
        .querySelector(EXPANDED_TOAST_SELECTOR)
        ?.closest(TOASTER_SELECTOR)
      if (!toaster) return
      if (event.target instanceof Node && toaster.contains(event.target)) return
      toaster.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }))
    }

    document.addEventListener("pointerdown", handlePointerDown, true)
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true)
  }, [])
}

// 앱이 라이트 테마만 지원하므로 next-themes 없이 고정함.
const Toaster = ({ ...props }: ToasterProps) => {
  useCollapseOnOutsideTouch()

  return (
    <Sonner
      theme="light"
      // Figma 토스트 시안(6706:13698 등)은 화면 상단 가운데에 뜹니다.
      position="top-center"
      className="toaster group"
      offset={TOAST_OFFSET}
      mobileOffset={TOAST_OFFSET}
      closeButton
      // sonner 기본값은 position(top-center)에서 정해져 위로만 밀어서 닫을 수 있음. 위를 유지하고 좌우를 더함.
      // 터치에서 위로 끄는 움직임은 index.css가 제한함.
      swipeDirections={["top", "left", "right"]}
      icons={{
        loading: <Loader2Icon className="size-4 animate-spin" />,
        close: <XIcon className="size-4" />,
      }}
      toastOptions={{ unstyled: true, classNames: toasterClassNames }}
      style={{ "--width": TOAST_WIDTH } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster, toastStyles }
