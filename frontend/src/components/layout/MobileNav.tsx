import { NavLink } from "react-router-dom";
import { LayoutDashboard, Library, Menu, MessageSquare, Search } from "lucide-react";

import { cn } from "@/lib/utils";

const mobileNavItems = [
  { title: "Home", href: "/", icon: LayoutDashboard },
  { title: "Notes", href: "/notes", icon: Library },
  { title: "Search", href: "/search", icon: Search },
  { title: "Chat", href: "/chat", icon: MessageSquare },
  { title: "More", href: "/upload", icon: Menu },
] as const;

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground",
                isActive && "text-primary",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
