import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apps Admin',
  description: 'Админка для управления доступом к приложениям',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}