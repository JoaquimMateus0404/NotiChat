import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { AppProvider } from "@/lib/app-context"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "ProConnect - Professional Social Network",
  description: "Connect with professionals, share insights, and grow your network",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <Navigation />
            </Suspense>
            <main className="pt-16">{children}</main>
          </AppProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
