import { createBrowserRouter } from "react-router";

import { trackHistoryTrail, trackRouterInitialized } from "@/shared/lib";

import { routes } from "./routes";

export const router = createBrowserRouter(routes);
trackRouterInitialized(router);
trackHistoryTrail(router);
