import {
  LayoutDashboard,
  Library,
  MessageSquare,
  Search,
  Settings,
  Upload,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Knowledge Base", href: "/notes", icon: Library },
  { title: "Search", href: "/search", icon: Search },
  { title: "AI Chat", href: "/chat", icon: MessageSquare },
  { title: "Upload Center", href: "/upload", icon: Upload },
  { title: "Settings", href: "/settings", icon: Settings },
];
