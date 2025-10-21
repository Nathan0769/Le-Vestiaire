"use client";

import "../../app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/useAuth";
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
      <Toaster position="top-right" duration={1500} richColors />
      <CookieConsent
        variant="default"
        description="Nous utilisons des cookies pour améliorer votre expérience sur Le Vestiaire. Ces cookies nous permettent d'analyser l'utilisation du site et d'améliorer nos services."
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
