"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth/AuthProvider"
import { LogOut, Bell } from "lucide-react"
import NotificationsBell from "@/components/NotificationsBell"

function getTitle(pathname: string | null): string {
  if (!pathname) return "YAP"
  if (pathname === "/dashboard") return "Dashboard"
  if (pathname === "/dashboard/projects") return "Projeler"
  if (pathname.startsWith("/dashboard/projects/")) return "Proje"
  if (pathname === "/dashboard/tasks") return "Görevler"
  if (pathname.startsWith("/dashboard/tasks/")) return "Görev"
  if (pathname === "/dashboard/teams") return "Takımlar"
  if (pathname.startsWith("/dashboard/teams/")) return "Takım"
  if (pathname === "/dashboard/notifications") return "Bildirimler"
  if (pathname === "/dashboard/account") return "Hesap"
  return "Dashboard"
}

export default function MobileHeader() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Sadece dashboard sayfalarında ve mobilde göster
  const show = React.useMemo(() => pathname?.startsWith("/dashboard") === true, [pathname])
  if (!show) return null

  return (
    <header className="md:hidden sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-8 w-8" />
          <Link href="/dashboard" className="font-semibold text-sm">{getTitle(pathname)}</Link>
        </div>
        <div className="flex items-center gap-1">
          {user ? <NotificationsBell userId={user.id} /> : <Button size="icon" variant="ghost" aria-label="Bildirimler"><Bell className="h-5 w-5" /></Button>}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">Çıkış</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login"><Button size="sm">Giriş</Button></Link>
          )}
        </div>
      </div>
    </header>
  )
}


