import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthSessionProvider } from "@/features/auth/AuthSessionProvider";
import { validateEnvironment } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turnuvani",
  description: "Turnuva oluşturma ve yönetim platformu",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  validateEnvironment();

  return (
    <html lang="tr">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
