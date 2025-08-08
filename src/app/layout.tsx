import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ThemeToggle from "@/components/theme/ThemeToggle";
import CommandMenu from "@/components/CommandMenu";
import Navbar from "@/components/layout/Navbar";
import { I18nProvider } from "@/i18n/I18nProvider";
import AppFrame from "@/components/layout/AppFrame";

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
          <AppFrame>{children}</AppFrame>
          <ThemeToggle />
          <CommandMenu />
        </AuthTree>
        <Toaster richColors position="top-center" />
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
