"use client";

import "../../app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/useAuth";
import { QueryProvider } from "@/providers/QueryProvider";
import { ApplyThemeColor } from "@/providers/themes-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { AnalyticsWrapper } from "@/components/analytics-wrapper";

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
      <QueryProvider>
        <AuthProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <main className="flex-1">
              <SidebarTrigger />
              {children}
              <AnalyticsWrapper />
            </main>
          </SidebarProvider>
        </AuthProvider>
      </QueryProvider>
      <Toaster position="top-right" duration={1500} richColors />
      <CookieConsent
        variant="default"
        learnMoreHref="/politique-cookies"
        onAcceptCallback={() => {
          console.log("Cookies acceptés");
        }}
        onDeclineCallback={() => {
          console.log("Cookies refusés");
        }}
      />
    </ThemeProvider>
  );
}
