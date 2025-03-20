import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "./components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sales Lead Tracker",
  description: "Track and manage your sales leads efficiently",
  generator: 'v0.dev'
}

export default function SalesLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="p-6">
      {children}
    </div>
  )
}

