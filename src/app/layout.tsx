import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NotificationProvider } from '@/components/providers/NotificationProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YAP - Proje Yönetim Sistemi',
  description: 'Modern proje yönetim platformu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <NotificationProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </NotificationProvider>
      </body>
    </html>
  )
}
