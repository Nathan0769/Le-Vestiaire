"use client";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/useAuth";
import { ApplyThemeColor } from "@/providers/themes-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultOpen = true;

  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
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
                <Analytics></Analytics>
              </main>
            </SidebarProvider>
          </AuthProvider>
          <Toaster position="top-right" duration={1500} richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
