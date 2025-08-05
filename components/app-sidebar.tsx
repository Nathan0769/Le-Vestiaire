import { ListTodo, Home, Settings, Shirt, UsersRound } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { EditProfile } from "@/components/profiles/editProfile";

const items = [
  {
    title: "Accueil",
    url: "/",
    icon: Home,
  },
  {
    title: "Ma Collection",
    url: "/inbox",
    icon: Shirt,
  },
  {
    title: "Les Maillots",
    url: "/leagues",
    icon: ListTodo,
  },
  {
    title: "La Communauté",
    url: "/search",
    icon: UsersRound,
  },
  {
    title: "Compte",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="flex h-screen flex-col justify-between">
      <SidebarContent className="flex-grow">
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-y-3">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="px-4 py-3 gap-3 text-base hover:bg-primary/20 rounded-md transition-colors"
                  >
                    <a href={item.url} className="flex items-center w-full">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
