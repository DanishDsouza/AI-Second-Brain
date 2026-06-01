import { Outlet } from "react-router-dom";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppLayout() {
  return (
    <TooltipProvider>
      <div className="flex h-svh bg-background text-foreground">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    </TooltipProvider>
  );
}
