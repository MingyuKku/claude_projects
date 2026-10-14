import { Outlet } from "react-router";

export function RootLayout() {
  return <Outlet />;
}

// 첫 진입 시 lazy 라우트가 로드되는 동안 보여준다.
export function PageFallback() {
  return (
    <div role="status" className="p-8 text-sm text-neutral-500">
      불러오는 중…
    </div>
  );
}
