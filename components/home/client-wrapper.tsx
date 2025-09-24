"use client";

import "../../app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/useAuth";
import { ApplyThemeColor } from "@/providers/themes-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultOpen = true;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ApplyThemeColor />
      <AuthProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <main className="flex-1">
            <SidebarTrigger />
            {children}
            <Analytics />
            <SpeedInsights />
          </main>
        </SidebarProvider>
      </AuthProvider>
      <Toaster position="top-right" duration={1500} richColors />
    </ThemeProvider>
  );
}
