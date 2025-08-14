"use client"

import ChatWidget from "@/components/ChatWidget"
import { usePathname } from "next/navigation"

export default function ChatWidgetGuard() {
  const pathname = usePathname()
  const show = pathname?.startsWith("/dashboard") === true
  if (!show) return null
  return <ChatWidget />
}


