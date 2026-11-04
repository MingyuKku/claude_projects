import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";

import {
  rememberCurrentLocation,
  takeForbiddenNotice,
} from "../router/session-middleware";

const FORBIDDEN_TOAST_ID = "route-forbidden";

export function RootLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  // 그려진 화면의 주소를 세션 middleware에 알리고, 권한이 없어 이동을 막았으면 알림.
  useEffect(() => {
    rememberCurrentLocation(location);
    if (takeForbiddenNotice()) {
      toast.error(t("error.forbidden"), { id: FORBIDDEN_TOAST_ID });
    }
  }, [location, t]);

  return <Outlet />;
}
