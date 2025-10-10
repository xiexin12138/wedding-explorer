import type { Metadata } from "next";
import { AnalyticsScript } from "@/components/AnalyticsScript";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserProvider } from "@/components/UserProvider";
import { ViewportHeightProvider } from "@/components/ViewportHeightProvider";
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/client-config";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <AnalyticsScript />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <ViewportHeightProvider>
              <div className="h-screen-dynamic flex flex-col">
                <main className="flex-1">{children}</main>
                <Toaster />
              </div>
            </ViewportHeightProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
