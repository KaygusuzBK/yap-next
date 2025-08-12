import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import CommandMenu from "@/components/CommandMenu";
import Navbar from "@/components/layout/Navbar";
import { I18nProvider } from "@/i18n/I18nProvider";
import AppFrame from "@/components/layout/AppFrame";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ChatWidget from "@/components/ChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YAP - Proje Yönetimi",
  description: "Modern proje yönetimi platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthTree>
          <Navbar />
          {/* Mobile header is rendered inside dashboard pages by Navbar returning null there; include explicitly */}
          {/* MobileHeader will self-hide on non-dashboard paths */}
          {/* eslint-disable-next-line react/jsx-no-undef */}
          {/* <MobileHeader /> */}
          <AppFrame>{children}</AppFrame>
          <CommandMenu />
          <ChatWidget />
        </AuthTree>
        <Toaster richColors position="top-center" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

function AuthTree({ children }: { children: React.ReactNode }) {
  // Client context tree for auth
  return <ClientAuthProvider>{children}</ClientAuthProvider>;
}

function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
