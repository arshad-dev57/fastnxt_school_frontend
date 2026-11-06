import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { BranchProvider } from "@/lib/branch-context";
import { AuthProvider } from "@/lib/auth/auth-context";
import { MeetingsProvider } from "@/lib/meetings-store";
import { DEFAULT_THEME, THEME_ORDER, THEME_STORAGE_KEY, buildThemeCss } from "@/lib/theme/themes";

export const metadata: Metadata = {
  title: "FastNxt",
  description: "School Management System",
};


/* Runs before first paint so a saved theme never flashes the Default theme. */
const themeInitScript =
  `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)},ok=${JSON.stringify(THEME_ORDER)},t=localStorage.getItem(k);` +
  `if(t&&ok.indexOf(t)>-1){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        {/* All theme tokens (--theme-*) generated from lib/theme/themes.ts */}
        <style id="theme-tokens" dangerouslySetInnerHTML={{ __html: buildThemeCss() }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <BranchProvider>
              <MeetingsProvider>{children}</MeetingsProvider>
            </BranchProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
