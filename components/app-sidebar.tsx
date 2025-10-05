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
  return (
    <Sidebar className="flex h-screen flex-col justify-between">
      <SidebarContent className="flex-grow">
        <SidebarGroup>
          <SidebarGroupLabel>Le Vestiaire</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-y-3">
              {items.map((item) => (
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
