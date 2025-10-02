import { notFound } from "next/navigation";
import React from "react";

// Development only page
// Renders a simple request tester to verify endpoints/functions during development

function DevOnlyGuard({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return <>{children}</>;
}

function RequestTester() {
  "use client";

  const [requestUrl, setRequestUrl] = React.useState<string>("/api");
  const [method, setMethod] = React.useState<string>("GET");
  const [headersText, setHeadersText] = React.useState<string>("{\n  \"Content-Type\": \"application/json\"\n}");
  const [bodyText, setBodyText] = React.useState<string>("{\n  \"example\": true\n}");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [responseStatus, setResponseStatus] = React.useState<string>("");
  const [responseTimeMs, setResponseTimeMs] = React.useState<number | null>(null);
  const [responseBody, setResponseBody] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  async function handleSend() {
    setIsLoading(true);
    setErrorMessage("");
    setResponseBody("");
    setResponseStatus("");
    setResponseTimeMs(null);

    let parsedHeaders: Record<string, string> = {};
    try {
      parsedHeaders = headersText.trim() ? JSON.parse(headersText) : {};
    } catch (error) {
      setIsLoading(false);
      setErrorMessage("Headers JSON geçersiz.");
      return;
    }

    let fetchBody: BodyInit | undefined = undefined;
    if (method !== "GET" && method !== "HEAD") {
      try {
        fetchBody = bodyText.trim() ? JSON.stringify(JSON.parse(bodyText)) : undefined;
      } catch (error) {
        setIsLoading(false);
        setErrorMessage("Body JSON geçersiz.");
        return;
      }
    }

    const startedAt = performance.now();
    try {
      const res = await fetch(requestUrl, {
        method,
        headers: parsedHeaders,
        body: fetchBody,
      });
      const endedAt = performance.now();
      setResponseTimeMs(Math.round(endedAt - startedAt));
      setResponseStatus(`${res.status} ${res.statusText}`);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        setResponseBody(JSON.stringify(json, null, 2));
      } else {
        const text = await res.text();
        setResponseBody(text);
      }
    } catch (error: unknown) {
      const endedAt = performance.now();
      setResponseTimeMs(Math.round(endedAt - startedAt));
      setErrorMessage(error instanceof Error ? error.message : "Bilinmeyen hata");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Geliştirme Araçları · İstek Deneme</h1>
      <p className="text-sm text-gray-500">
        Bu sayfa sadece development ortamında açıktır. API ve fonksiyonlarınızı hızlıca test edin.
      </p>

      <div className="space-y-3 border rounded-md p-4">
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="border rounded-md px-2 py-1"
          >
            {[
              "GET",
              "POST",
              "PUT",
              "PATCH",
              "DELETE",
              "HEAD",
              "OPTIONS",
            ].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            className="flex-1 border rounded-md px-3 py-2"
            value={requestUrl}
            onChange={(e) => setRequestUrl(e.target.value)}
            placeholder="/api/your-endpoint"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !requestUrl}
            className="border rounded-md px-4 py-2 bg-black text-white disabled:opacity-50"
          >
            {isLoading ? "Gönderiliyor..." : "Gönder"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Headers (JSON)</label>
            <textarea
              className="w-full border rounded-md p-2 font-mono text-sm min-h-[140px]"
              value={headersText}
              onChange={(e) => setHeadersText(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Body (JSON)</label>
            <textarea
              className="w-full border rounded-md p-2 font-mono text-sm min-h-[140px]"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              disabled={method === "GET" || method === "HEAD"}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-4 text-sm">
          {responseStatus && (
            <span className="inline-block rounded-md bg-gray-100 px-2 py-1">
              Durum: {responseStatus}
            </span>
          )}
          {typeof responseTimeMs === "number" && (
            <span className="inline-block rounded-md bg-gray-100 px-2 py-1">
              Süre: {responseTimeMs} ms
            </span>
          )}
        </div>

        {errorMessage && (
          <pre className="whitespace-pre-wrap break-all text-red-600 text-sm border border-red-200 bg-red-50 rounded-md p-3">
            {errorMessage}
          </pre>
        )}

        {responseBody && (
          <pre className="overflow-auto text-sm border rounded-md p-3 bg-gray-50">
            {responseBody}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function DevPage() {
  return (
    <DevOnlyGuard>
      <RequestTester />
    </DevOnlyGuard>
  );
}



