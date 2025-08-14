"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Folder, ListTodo, Users, Bell, User2 } from "lucide-react"
import QuickTaskCreator from "@/components/mobile/QuickTaskCreator"

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname.startsWith(href)
}

export default function MobileTabBar() {
  const pathname = usePathname()

  // Sadece dashboard sayfalarında ve mobilde göster
  const show = React.useMemo(() => pathname?.startsWith("/dashboard") === true, [pathname])
  if (!show) return null

  const navItems = [
    { href: "/dashboard", label: "Ana", Icon: Home },
    { href: "/dashboard/projects", label: "Projeler", Icon: Folder },
    { href: "/dashboard/tasks", label: "Görevler", Icon: ListTodo },
    { href: "/dashboard/teams", label: "Takımlar", Icon: Users },
    { href: "/dashboard/notifications", label: "Bildirim", Icon: Bell },
    { href: "/dashboard/account", label: "Hesap", Icon: User2 },
  ] as const

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75" role="navigation" aria-label="Alt sekme çubuğu">
      <div className="grid grid-cols-5 items-center px-1 py-1" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {navItems.slice(0, 2).map(({ href, label, Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-xs transition-colors " +
                (active ? "text-primary" : "text-muted-foreground hover:text-foreground")
              }
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}

        <div className="flex items-center justify-center">
          <QuickTaskCreator />
        </div>

        {navItems.slice(2, 4).map(({ href, label, Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-xs transition-colors " +
                (active ? "text-primary" : "text-muted-foreground hover:text-foreground")
              }
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-1 px-2 pb-2">
        {navItems.slice(4).map(({ href, label, Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs transition-colors " +
                (active ? "text-primary" : "text-muted-foreground hover:text-foreground")
              }
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}


