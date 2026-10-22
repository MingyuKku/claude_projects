import { Loader2Icon, XIcon } from "lucide-react"
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

// 앱이 라이트 테마만 지원하므로 next-themes 없이 고정함.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      offset={TOAST_OFFSET}
      mobileOffset={TOAST_OFFSET}
      closeButton
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
