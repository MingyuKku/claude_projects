import { Link } from "react-router";

import { ROUTES } from "@/shared/config";

export function NotFoundPage() {
  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h1>
      <Link to={ROUTES.home} className="mt-4 inline-block text-sm underline">
        홈으로 돌아가기
      </Link>
    </main>
  );
}
