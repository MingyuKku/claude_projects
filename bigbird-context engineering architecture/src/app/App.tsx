import { RouterProvider } from "react-router";

import { SWRProvider } from "./providers/SWRProvider";
import { router } from "./router";

export function App() {
  return (
    <SWRProvider>
      <RouterProvider router={router} />
    </SWRProvider>
  );
}
