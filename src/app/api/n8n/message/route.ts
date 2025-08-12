import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const message = body?.message as string | undefined
    const context = body?.context ?? null
    const target = (body?.target as string | undefined)?.toLowerCase()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "'message' zorunlu" }, { status: 400 })
    }

    const baseUrl = process.env.N8N_ASSISTANT_WEBHOOK_URL
    const prodUrl = process.env.N8N_ASSISTANT_WEBHOOK_URL_PROD
    const testUrl = process.env.N8N_ASSISTANT_WEBHOOK_URL_TEST

    // Öncelik: body.target > VERCEL_ENV production > base
    let webhookUrl: string | undefined
    if (target === "prod" || target === "production") webhookUrl = prodUrl
    else if (target === "test") webhookUrl = testUrl
    else if (target === "default") webhookUrl = baseUrl
    else if (process.env.VERCEL_ENV === "production") webhookUrl = prodUrl || baseUrl
    else webhookUrl = testUrl || baseUrl

    if (!webhookUrl) {
      return NextResponse.json({ error: "N8N webhook URL bulunamadı (env değişkenleri eksik)" }, { status: 500 })
    }

    const forwardedFor = request.headers.get("x-forwarded-for")
    const ip = forwardedFor ? (forwardedFor.split(",")[0]?.trim() || null) : null
    const userAgent = request.headers.get("user-agent") || null
    const referer = request.headers.get("referer") || null

    const payload = {
      message,
      context,
      meta: {
        ip,
        userAgent,
        referer,
        timestamp: new Date().toISOString(),
      },
    }

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => "")
      return NextResponse.json(
        { error: "Webhook isteği başarısız", details: text },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 })
  }
}


