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
} from "lucide-react";
import { Avatar, Button, Dropdown, Label } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";
import { useEditorStore } from "@/stores/editor-store";
import { cn, isPro } from "@/lib/utils";

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
}

export function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  isCollapsed,
  setIsCollapsed,
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

  return (
    <aside
      className={`fixed inset-y-0 left-0 border-r border-zinc-200/80 bg-white shadow-sm z-50 flex flex-col transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* Header / Logo */}
      <div
        className={`relative flex items-center h-16 shrink-0 border-b border-zinc-100 transition-all ${isCollapsed ? "justify-center px-0" : "px-6"}`}
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
            <span className="font-bold tracking-tight text-lg bg-linear-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              PrettyShot
            </span>
          )}
        </Link>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-5 size-6 items-center justify-center rounded-full border border-orange-100 bg-white shadow-sm shadow-orange-100/50 text-orange-400 hover:text-orange-600 hover:border-orange-200 z-50 hidden md:flex transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="size-3" />
          ) : (
            <ChevronLeft className="size-3" />
          )}
        </button>

        {/* Mobile Close Button */}
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="md:hidden text-zinc-400 absolute right-4 top-3.5"
          onPress={() => setIsSidebarOpen(false)}
        >
          <X className="size-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-2">
        <div
          className={`mb-2 transition-all ${isCollapsed ? "text-center" : "px-2"}`}
        >
          {!isCollapsed ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Main
            </span>
          ) : (
            <div className="h-px w-4 bg-zinc-200 mx-auto rounded-full" />
          )}
        </div>

        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              onClick={() => {
                if (item.href === "/editor") {
                  useEditorStore.getState().reset();
                }
                setIsSidebarOpen(false);
              }}
              className={`flex items-center ${isCollapsed ? "justify-center px-0" : "px-3"} py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-linear-to-r from-orange-50 to-rose-50 text-orange-700 shadow-sm shadow-orange-100/50 ring-1 ring-orange-100/50"
                  : "text-zinc-500 hover:bg-orange-50/50 hover:text-orange-600"
              }`}
            >
              <item.icon
                className={`size-4.5 shrink-0 ${
                  isActive
                    ? "text-orange-500"
                    : "text-zinc-400 group-hover:text-orange-400"
                }`}
              />
              {!isCollapsed && (
                <span className="ml-3 truncate flex-1">{item.name}</span>
              )}
              {!isCollapsed && isActive && (
                <ChevronRight className="size-4 opacity-50 text-orange-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile with Dropdown */}
      <div className="shrink-0 flex flex-col mt-auto">
        <div
          className={`relative flex items-center py-4 border-t border-zinc-200/80 bg-white ${isCollapsed ? "px-2" : "px-4"}`}
        >
          <Dropdown>
            <Dropdown.Trigger>
              <div
                className={`flex items-center gap-3 w-full cursor-pointer hover:bg-orange-50/50 p-2 rounded-xl transition-colors ${isCollapsed ? "justify-center" : ""}`}
              >
                <Avatar>
                  <Avatar.Image src={user.user_metadata.avatar_url} />
                  <Avatar.Fallback className="bg-linear-to-br from-orange-100 to-rose-100 text-orange-700 font-medium">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </Avatar.Fallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden pl-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-zinc-900 truncate leading-tight">
                          {user.user_metadata.full_name ||
                            user.email?.split("@")[0] ||
                            "User"}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full bg-linear-to-r px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white leading-none shadow-sm shadow-orange-500/20",
                            pro.type === "pro"
                              ? "from-orange-500 to-rose-500"
                              : pro.type === "trial"
                                ? "from-indigo-600 to-indigo-400"
                                : "from-gray-700 to-gray-500",
                          )}
                        >
                          {pro.type.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-zinc-500 truncate mt-0.5">
                        {user.email}
                      </span>
                    </div>
                    <MoreVertical className="size-4 text-zinc-400 shrink-0" />
                  </>
                )}
              </div>
            </Dropdown.Trigger>
            <Dropdown.Popover
              placement={isCollapsed ? "right bottom" : "top"}
            >
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
                  className="flex items-center gap-2 text-rose-500 hover:text-rose-600"
                  onAction={handleLogout}
                >
                  <LogOut className="size-4" />
                  <Label>Logout Account</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>
    </aside>
  );
}
