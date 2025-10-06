"use client";

import {
  ListTodo,
  Home,
  Settings,
  Shirt,
  UsersRound,
  Heart,
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
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import React from "react";
import { usePendingRequestsCount } from "@/hooks/usePendingRequestsCount";

const items = [
  {
    title: "Accueil",
    url: "/",
    icon: Home,
  },
  {
    title: "Ma Collection",
    url: "/collection",
    icon: ListTodo,
  },
  {
    title: "Mes Envies",
    url: "/wishlist",
    icon: Heart,
  },
  {
    title: "Les Maillots",
    url: "/jerseys",
    icon: Shirt,
  },
  {
    title: "La Communauté",
    url: "/friends",
    icon: UsersRound,
    disabled: false,
  },
  {
    title: "Compte",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [openCommunaute, setOpenCommunaute] = React.useState(false);
  const { count: pendingCount } = usePendingRequestsCount();

  return (
    <Sidebar className="flex h-screen flex-col justify-between">
      <SidebarContent className="flex-grow">
        <SidebarGroup>
          <SidebarGroupLabel>Le Vestiaire</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-y-3">
              {items.map((item) => {
                if (item.title === "La Communauté") {
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
                              openCommunaute
                                ? "Fermer le menu"
                                : "Ouvrir le menu"
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
                                <span>Amis</span>
                                {pendingCount > 0 && (
                                  <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-medium">
                                    {pendingCount}
                                  </span>
                                )}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                href="/"
                                isActive={false}
                                className=" text-gray-400 opacity-50"
                                onClick={(e) => e.preventDefault()}
                                tabIndex={-1}
                              >
                                Collection des amis
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                href="/"
                                isActive={false}
                                className=" text-gray-400 opacity-50"
                                onClick={(e) => e.preventDefault()}
                                tabIndex={-1}
                              >
                                Ajout de maillots
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
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-2">
        <EditProfile />
      </SidebarFooter>
    </Sidebar>
  );
}
