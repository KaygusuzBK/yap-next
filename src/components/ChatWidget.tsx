"use client"

import React from "react"
import { MessageSquare, X, Send, Loader2, Bot, UserRound, Smile, Paperclip, Image as ImageIcon, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { usePathname } from "next/navigation"

export default function ChatWidget() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [messages, setMessages] = React.useState<{ role: "user" | "bot"; content: string }[]>([])
  const { user } = useAuth()
  const pathname = usePathname()
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const botName = React.useMemo(() => process.env.NEXT_PUBLIC_BOT_NAME || "YAP_BOT", [])
  const userDisplay = React.useMemo(() => {
    const email = user?.email || ""
    type Meta = { full_name?: string; name?: string }
    const meta = (user?.user_metadata || {}) as Meta
    const full = meta.full_name || meta.name || ""
    return full || (email ? email.split("@")[0] : "Kullanıcı")
  }, [user])

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen])

  const handleSend = async () => {
    const trimmed = message.trim()
    if (!trimmed) {
      toast.error("Lütfen bir mesaj yazın")
      return
    }
    setIsSending(true)
    // Kullanıcı mesajını anında listeye ekle ve inputu hemen temizle
    setMessages(prev => [...prev, { role: "user", content: trimmed }])
    setMessage("")
    try {
      // Ortama göre webhook seçimi
      const vercelEnv = (process.env.NEXT_PUBLIC_VERCEL_ENV || "").toLowerCase()
      const baseUrl = process.env.NEXT_PUBLIC_N8N_ASSISTANT_WEBHOOK_URL
      const prodUrl = process.env.NEXT_PUBLIC_N8N_ASSISTANT_WEBHOOK_URL_PROD
      const testUrl = process.env.NEXT_PUBLIC_N8N_ASSISTANT_WEBHOOK_URL_TEST

      const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

      let webhookUrl: string | undefined
      if (vercelEnv === 'production') {
        webhookUrl = prodUrl || baseUrl
      } else if (isLocalhost) {
        webhookUrl = baseUrl || testUrl
      } else {
        // preview veya diğer ortamlar
        webhookUrl = testUrl || baseUrl
      }

      if (!webhookUrl) {
        throw new Error('Webhook URL tanımlı değil (env değişkenleri eksik)')
      }

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          context: {
            path: pathname,
            userId: user?.id ?? null,
            email: user?.email ?? null,
          },
        }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || `İstek başarısız: ${res.status}`)
      }
      // Dönen veriyi normalize et: [{ output: "..." }] formatı ve benzerleri desteklenir
      const normalizeText = (val: unknown): string => {
        if (typeof val === "string") return val.replaceAll("↵", "\n").trim()
        if (val && typeof val === "object") return JSON.stringify(val)
        return ""
      }

      let botReply = ""
      try {
        const data = await res.json()
        if (Array.isArray(data)) {
          const parts = data.map(item => {
            if (typeof item === "string") return item
            if (item && typeof item === "object" && "output" in item) {
              const out = (item as Record<string, unknown>)["output"]
              return typeof out === "string" ? out : normalizeText(out as unknown)
            }
            return normalizeText(item)
          })
          botReply = parts.join("\n").replaceAll("↵", "\n").trim()
        } else if (data && typeof data === "object") {
          const maybe = (data as Record<string, unknown>)["output"]
            ?? (data as Record<string, unknown>)["reply"]
            ?? (data as Record<string, unknown>)["message"]
            ?? (data as Record<string, unknown>)["text"]
          botReply = normalizeText(maybe)
        } else if (typeof data === "string") {
          botReply = normalizeText(data)
        }
      } catch {
        const text = await res.text().catch(() => "")
        botReply = normalizeText(text)
      }

      if (!botReply) botReply = "(Yanıt alınamadı)"
      setMessages(prev => [...prev, { role: "bot", content: botReply }])
      setMessage("")
    } catch (err) {
      const e = err as Error
      toast.error(e.message || "Bir hata oluştu")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed z-[60] bottom-20 left-4 right-auto md:bottom-4 md:right-4 md:left-auto">
      {isOpen && (
        <Card className="w-[380px] sm:w-[420px] shadow-xl border bg-background/95 backdrop-blur">
          <CardHeader className="py-3 px-4 flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary"><Bot className="h-3 w-3" /></AvatarFallback>
              </Avatar>
              <CardTitle className="text-base flex items-center gap-2">
                {botName}
                <Sparkles className="h-4 w-4 text-primary" />
              </CardTitle>
            </div>
            <button aria-label="Kapat" title="Kapat" className="p-2 rounded hover:bg-muted" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="pt-0 px-4">
            <div ref={scrollRef} className="mb-3 max-h-96 overflow-auto space-y-2 pr-1">
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === "bot" ? "flex items-start gap-2" : "flex items-start gap-2 justify-end"}>
                  {m.role === "bot" ? (
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary"><Bot className="h-3 w-3" /></AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div className="max-w-[80%]">
                    <div className="mb-1 text-[11px] text-muted-foreground">
                      {m.role === "bot" ? botName : userDisplay}
                    </div>
                    <div
                      className={
                        m.role === "bot"
                          ? "rounded-md bg-muted/60 px-3 py-2 text-sm whitespace-pre-wrap break-words"
                          : "rounded-md bg-primary/90 text-primary-foreground px-3 py-2 text-sm whitespace-pre-wrap break-words"
                      }
                    >
                      {m.content}
                    </div>
                  </div>
                  {m.role === "user" ? (
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-[10px] bg-muted text-foreground"><UserRound className="h-3 w-3" /></AvatarFallback>
                    </Avatar>
                  ) : null}
                </div>
              ))}
              {isSending && (
                <div className="flex items-start gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary"><Bot className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                  <div className="rounded-md bg-muted/60 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Yazıyor...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-0 px-4 pb-4 flex items-center gap-2">
            <button type="button" className="p-2 rounded-md hover:bg-muted" aria-label="Emoji" disabled={isSending}>
              <Smile className="h-4 w-4" />
            </button>
            <button type="button" className="p-2 rounded-md hover:bg-muted" aria-label="Dosya ekle" disabled={isSending}>
              <Paperclip className="h-4 w-4" />
            </button>
            <button type="button" className="p-2 rounded-md hover:bg-muted" aria-label="Görsel ekle" disabled={isSending}>
              <ImageIcon className="h-4 w-4" />
            </button>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (!isSending) void handleSend()
                }
              }}
              placeholder="Mesaj yazın..."
              className="h-12 min-h-0 resize-none flex-1 text-sm"
              maxLength={2000}
            />
            <Button onClick={handleSend} size="icon" className="h-9 w-9" disabled={isSending}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="flex justify-start mt-3 md:justify-end">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label="Mesaj gönder"
          onClick={() => setIsOpen((v) => !v)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}


