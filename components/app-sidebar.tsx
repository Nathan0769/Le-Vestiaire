"use client";

import {
  ListTodo,
  Home,
  Settings,
  Shirt,
  UsersRound,
  Heart,
  Shield,
  Trophy,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { EditProfile } from "@/components/profiles/editProfile";
import { SocialLinks } from "@/components/ui/social-links";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import React from "react";
import { usePendingRequestsCount } from "@/hooks/usePendingRequestsCount";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isHotkeyPressed } from "react-hotkeys-hook";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function AppSidebar() {
  const t = useTranslations("Sidebar");
  const [openCommunaute, setOpenCommunaute] = React.useState(true);
  const { count: pendingCount } = usePendingRequestsCount();
  const currentUser = useCurrentUser();
  const router = useRouter();

  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "superadmin";

  const isContributor =
    currentUser?.role === "contributor" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "superadmin";

  const items = [
    {
      title: t("home"),
      url: "/",
      icon: Home,
    },
    {
      title: t("collection"),
      url: "/collection",
      icon: ListTodo,
    },
    {
      title: t("wishlist"),
      url: "/wishlist",
      icon: Heart,
    },
    {
      title: t("jerseys"),
      url: "/jerseys",
      icon: Shirt,
    },
    {
      title: t("community"),
      url: "/friends",
      icon: UsersRound,
      disabled: false,
    },
    {
      title: t("leaderboard"),
      url: "/leaderboard",
      icon: Trophy,
    },
    {
      title: t("authentication"),
      url: "/authentification",
      icon: Shield,
    },
    {
      title: t("settings"),
      url: "/settings",
      icon: Settings,
    },
  ];

  const handleVestiaireClick = () => {
    if (isHotkeyPressed("shift") && isAdmin) {
      router.push("/admin");
    }
  };

  return (
    <Sidebar className="flex h-screen flex-col justify-between">
      <SidebarContent className="flex-grow flex flex-col">
        <SidebarGroup>
          <SidebarGroupLabel
            onClick={handleVestiaireClick}
            className={isAdmin ? "cursor-pointer select-none" : ""}
          >
            {t("appName")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-y-3">
              {items.map((item) => {
                if (item.url === "/friends") {
                  return (
                    <Collapsible
                      key={item.title}
                      open={openCommunaute}
                      onOpenChange={setOpenCommunaute}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <div className="flex w-full items-center">
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              asChild={false}
                              className={`px-4 py-3 gap-3 text-base cursor-pointer rounded-md transition-colors flex-1 text-left hover:bg-primary/20 data-[state=open]:text-foreground data-[state=open]:hover:bg-primary/20`}
                              disabled={item.disabled}
                            >
                              <span className="flex items-center gap-3">
                                <item.icon className="h-5 w-5" />
                                <span>{item.title}</span>
                              </span>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <button
                            type="button"
                            aria-label={
                              openCommunaute ? t("closeMenu") : t("openMenu")
                            }
                            onClick={() => setOpenCommunaute((v) => !v)}
                            className={`ml-2 cursor-pointer transition-transform ${
                              openCommunaute ? "rotate-180" : ""
                            }`}
                            tabIndex={-1}
                          >
                            <ChevronDown className="w-4 h-4 text-primary" />
                          </button>
                        </div>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                href="/friends"
                                isActive={false}
                                className="hover:bg-primary/20 flex items-center justify-between"
                              >
                                <span>{t("friends")}</span>
                                {pendingCount > 0 && (
                                  <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-medium">
                                    {pendingCount}
                                  </span>
                                )}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                href="/friends/collections"
                                isActive={false}
                                className="hover:bg-primary/20"
                              >
                                {t("friendsCollections")}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                href={
                                  isContributor
                                    ? "/community/propose-jersey"
                                    : "/"
                                }
                                isActive={false}
                                className={
                                  isContributor
                                    ? "hover:bg-primary/20"
                                    : "text-gray-400 opacity-50"
                                }
                                onClick={
                                  isContributor
                                    ? undefined
                                    : (e) => e.preventDefault()
                                }
                                tabIndex={isContributor ? 0 : -1}
                              >
                                {t("jerseySuggestions")}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={!item.disabled}
                      className={`px-4 py-3 gap-3 text-base rounded-md transition-colors ${
                        item.disabled
                          ? "text-gray-400 cursor-not-allowed opacity-50"
                          : "hover:bg-primary/20"
                      }`}
                      disabled={item.disabled}
                    >
                      {item.disabled ? (
                        <div className="flex items-center w-full gap-3">
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </div>
                      ) : (
                        <a href={item.url} className="flex items-center w-full">
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </a>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto">
          <LanguageSwitcher />
          <div className="px-4 pb-2">
            <SocialLinks />
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-2">
        <EditProfile />
      </SidebarFooter>
    </Sidebar>
  );
}
