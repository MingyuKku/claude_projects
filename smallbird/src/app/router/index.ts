import { createBrowserRouter } from "react-router";

import { trackRouterInitialized } from "@/shared/lib";

import { routes } from "./routes";

export const router = createBrowserRouter(routes);
trackRouterInitialized(router);
