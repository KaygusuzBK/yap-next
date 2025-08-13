"use client";

import React from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Bir şeyler ters gitti</h1>
          <p className="text-sm text-muted-foreground break-words">
            {error?.message || "Beklenmeyen bir hata oluştu."}
          </p>
          {error?.digest && (
            <p className="text-xs text-muted-foreground">Hata kodu: {error.digest}</p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              className="inline-flex items-center px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium"
              onClick={() => reset()}
            >
              Tekrar dene
            </button>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-md border text-sm font-medium"
            >
              Ana sayfa
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}


