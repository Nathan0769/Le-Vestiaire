"use client";

import "../../app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/useAuth";
import { QueryProvider } from "@/providers/QueryProvider";
import { ApplyThemeColor } from "@/providers/themes-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { EditProfile } from "@/components/profiles/editProfile";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { AnalyticsWrapper } from "@/components/analytics-wrapper";
import { FavoriteClubBanner } from "@/components/home/favorite-club-banner";

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
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded focus:bg-background focus:text-foreground focus:shadow-md"
            >
              Aller au contenu principal
            </a>
            <AppSidebar />
            <main id="main-content" className="flex-1 min-w-0 overflow-x-hidden">
              <SidebarTrigger />
              <div className="fixed top-2 right-2 z-40 flex items-center gap-1 bg-card border border-border rounded-full shadow-md px-1">
                <EditProfile iconOnly />
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="cursor-pointer rounded-full"
                  aria-label="Réglages"
                >
                  <Link href="/settings">
                    <Settings className="w-5 h-5" />
                  </Link>
                </Button>
                <NotificationBell />
              </div>
              <FavoriteClubBanner />
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
      />
    </ThemeProvider>
  );
}
