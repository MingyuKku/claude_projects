import { LucideProvider } from "lucide-react";
import { RouterProvider } from "react-router";

import { Toaster } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";

import { SWRProvider } from "./providers/SWRProvider";
import { router } from "./router";

export function App() {
  return (
    // Figma 아이콘은 크기(12~24px)와 관계없이 실제 선 두께 1px로 통일되어 있음.
    <LucideProvider strokeWidth={1} nonScalingStroke>
      <SWRProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </SWRProvider>
    </LucideProvider>
  );
}
