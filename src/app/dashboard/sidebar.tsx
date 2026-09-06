"use client";

import { useAppStore } from "@/stores/app-store";
import { usePathname } from "next/navigation";
import { useRouter } from "@/hooks/use-router";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  CreditCard,
  LogOut,
  X,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  MoreVertical,
  PanelsRightBottomIcon,
  FolderClosed,
  Settings,
} from "lucide-react";
import { Avatar, Button, Dropdown, Label } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";
import { useEditorEngine as useEditorStore } from "@/editor/lib/engine";
import { cn, isPro } from "@/lib/utils";
import { ADMIN_EMAILS } from "@/config";
import { adminNav } from "./admin-sidebar";

export const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "My Designs", href: "/dashboard/designs", icon: FolderClosed },
  { name: "Editor", href: "/editor", icon: PanelsRightBottomIcon },
  { name: "Billing & License", href: "/dashboard/billing", icon: CreditCard },
];

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isAdminRoute?: boolean;
}

export function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  isCollapsed,
  setIsCollapsed,
  isAdminRoute,
}: SidebarProps) {
  const { user, setUser } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  if (!user) return null;

  const pro = isPro(user);

  const dynamicNavigation = [
    ...navigation,
    ...(user.email && ADMIN_EMAILS.includes(user.email)
      ? [
          {
            name: "Admin",
            href: [...adminNav.map((n) => n.href)],
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 border-r border-border/60 bg-surface-muted shadow-sm z-50 flex flex-col transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* Header / Logo */}
      <div
        className={`relative flex items-center h-16 shrink-0 border-b border-border/60 transition-all ${isCollapsed ? "justify-center px-0" : "px-6"}`}
      >
        <Link
          href="/"
          className={`flex items-center gap-2.5 group ${isCollapsed ? "justify-center" : ""}`}
        >
          <Image
            src="/prettyshot.svg"
            alt="PrettyShot Logo"
            width={26}
            height={26}
            className="transition-transform duration-300 group-hover:scale-110 drop-shadow-sm shrink-0"
          />
          {!isCollapsed && (
            <span className="font-bold tracking-tight text-lg bg-linear-to-r from-primary to-danger bg-clip-text text-transparent">
              PrettyShot
            </span>
          )}
        </Link>

        {!isAdminRoute && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-5 size-6 items-center justify-center rounded-full border border-border bg-surface-muted text-primary hover:text-primary hover:border-primary/40 z-50 hidden md:flex transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="size-3" />
            ) : (
              <ChevronLeft className="size-3" />
            )}
          </button>
        )}

        {/* Mobile Close Button */}
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="md:hidden text-muted-foreground/60 absolute right-4 top-3.5"
          onPress={() => setIsSidebarOpen(false)}
        >
          <X className="size-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {dynamicNavigation.map((item) => {
          const href = typeof item.href === "string" ? item.href : item.href[0];
          const isActive =
            typeof item.href === "string"
              ? pathname === item.href
              : item.href.includes(pathname);
          return (
            <Link
              key={item.name}
              href={href}
              title={isCollapsed ? item.name : undefined}
              onClick={() => {
                if (item.href === "/editor") {
                  useEditorStore.getState().reset();
                }
                setIsSidebarOpen(false);
              }}
              className={`flex items-center ${isCollapsed ? "justify-center px-0" : "px-3"} py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-surface-muted text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-surface-muted/60 hover:text-primary"
              }`}
            >
              <item.icon
                className={`size-4.5 shrink-0 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/60 group-hover:text-primary"
                }`}
              />
              {!isCollapsed && (
                <span className="ml-3 truncate flex-1">{item.name}</span>
              )}
              {!isCollapsed && isActive && (
                <ChevronRight className="size-4 opacity-50 text-primary shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile with Dropdown */}
      <div className="shrink-0 flex flex-col mt-auto">
        <div
          className={`relative flex items-center py-4 border-t border-border/60 ${isCollapsed ? "px-2" : "px-4"}`}
        >
          <Dropdown>
            <Dropdown.Trigger>
              <div
                className={`flex items-center gap-3 w-full cursor-pointer hover:bg-surface-muted/60 p-2 rounded-xl transition-colors ${isCollapsed ? "justify-center" : ""}`}
              >
                <Avatar>
                  <Avatar.Image src={user.user_metadata.avatar_url} />
                  <Avatar.Fallback className="bg-linear-to-br from-warning-soft-hover to-danger-soft-hover text-primary font-medium">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </Avatar.Fallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden pl-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground truncate leading-tight">
                          {user.user_metadata.full_name ||
                            user.email?.split("@")[0] ||
                            "User"}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full bg-linear-to-r px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-foreground leading-none shadow-sm shadow-orange-500/20",
                            pro.type === "pro"
                              ? "from-primary to-danger"
                              : pro.type === "trial"
                                ? "from-indigo-600 to-indigo-400"
                                : "from-default to-muted-foreground",
                          )}
                        >
                          {pro.type.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
                        {user.email}
                      </span>
                    </div>
                    <MoreVertical className="size-4 text-muted-foreground/60 shrink-0" />
                  </>
                )}
              </div>
            </Dropdown.Trigger>
            <Dropdown.Popover placement={isCollapsed ? "right bottom" : "top"}>
              <Dropdown.Menu aria-label="Profile Actions">
                <Dropdown.Item
                  textValue="Help & Support"
                  className="flex items-center gap-2"
                >
                  <HelpCircle className="size-4" />
                  <Label>Help & Support</Label>
                </Dropdown.Item>
                <Dropdown.Item
                  textValue="Logout Account"
                  className="flex items-center gap-2 text-danger hover:text-danger/80"
                  onAction={handleLogout}
                >
                  <LogOut className="size-4" />
                  <Label>Logout</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>
    </aside>
  );
}
