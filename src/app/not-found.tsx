import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Sayfa bulunamadı</h1>
          <p className="text-sm text-muted-foreground">Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.</p>
          <Link href="/" className="inline-flex items-center px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium">
            Ana sayfaya dön
          </Link>
        </div>
      </body>
    </html>
  );
}


