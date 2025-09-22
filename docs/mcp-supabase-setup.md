### Supabase MCP Kurulumu (Proje API - Güvenli, Salt Okuma)

Bu proje, Supabase MCP sunucusunu güvenli varsayılanlarla başlatmak için bir script ve ayar şablonu içerir.

#### 1) Ortam değişkenlerini hazırlayın

`docs/mcp/.env.mcp.example` dosyasını köke `.env.mcp` adıyla kopyalayın ve doldurun:

```
cp docs/mcp/.env.mcp.example .env.mcp
```

Doldurmanız gereken alanlar:
- `SUPABASE_PROJECT_URL`: Settings → API → Project URL
- `SUPABASE_API_KEY`: `anon` (önerilir) veya yerel kullanım için `service_role`

Opsiyonel:
- `MCP_SUPABASE_READ_ONLY=true` (varsayılan true)
- `SUPABASE_ACCESS_TOKEN` ve `SUPABASE_PROJECT_REF` (Yönetim API modu kullanacaksanız)

#### 2) MCP sunucusunu başlatın

```
npm run mcp:supabase
```

Bu komut `scripts/mcp-supabase.sh` betiğini çalıştırır ve uygun bayraklarla MCP sunucusunu açar.

#### 3) Cursor'a ekleme (opsiyonel, otomatik başlatmak isterseniz)

Cursor → Settings → MCP Servers içine aşağıdaki girdiyi ekleyin:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-url", "https://<PROJECT_REF>.supabase.co",
        "--api-key", "<ANON_OR_SERVICE_ROLE_KEY>",
        "--read-only"
      ]
    }
  }
}
```

Yönetim API (PAT) modu isterseniz `--access-token` ve opsiyonel `--project-ref` kullanın.

#### 4) Test

İstemcinizi yeniden başlatın. "supabase" MCP sunucusu listede görünmeli.
- Proje API: "tasks tablosundan son 5 kaydı getir"
- PAT: "projelerimi listele"

#### Güvenlik Notları
- `service_role` anahtarını depo dışı ve sadece yerelde kullanın.
- Paylaşımda `anon` anahtarını tercih edin.
- `.env.mcp` commit etmeyin.


