import { Loader2Icon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

// shadcn/ui Spinner. 접근성 이름은 문구를 번역해 쓰도록 원본의 고정 영문("Loading") 대신 aria-label로 받음.
// 다른 요소(aria-busy 등)가 상태를 알리는 자리에서는 aria-hidden으로 두고 status 역할도 빼서 두 번 읽히지 않게 함.
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role={props["aria-hidden"] ? undefined : "status"}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
