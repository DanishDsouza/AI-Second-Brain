import { NavLink } from "react-router-dom";

import { mainNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  return (
    <aside className="hidden h-full w-60 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <span className="text-sm font-semibold">AI</span>
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">AI Second Brain</p>
          <p className="text-xs text-muted-foreground">Personal knowledge</p>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="flex flex-col gap-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  isActive &&
                    "border-l-2 border-primary bg-muted/60 pl-[10px] text-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.title}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
