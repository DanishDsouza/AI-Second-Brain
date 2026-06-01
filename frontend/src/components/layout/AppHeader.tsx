import { useLocation } from "react-router-dom";

import { mainNavItems } from "@/config/navigation";

export function AppHeader() {
  const { pathname } = useLocation();
  const current =
    mainNavItems.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    ) ?? mainNavItems[0];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{current.title}</h1>
        <p className="text-xs text-muted-foreground">AI Second Brain</p>
      </div>
    </header>
  );
}
