"use client"

import * as React from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { AppSidebar } from "@/components/app-sidebar"
import MobileHeader from "@/components/layout/MobileHeader"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()

  const showSidebar = React.useMemo(() => {
    if (!user) return false
    // Only show sidebar on dashboard and its sub-routes
    return pathname?.startsWith("/dashboard") === true
  }, [user, pathname])

  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "350px" } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset className="m-0 p-0">
        <MobileHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}


