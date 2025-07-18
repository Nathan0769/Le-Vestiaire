"use client";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ApplyThemeColor } from "@/providers/themes-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
