import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard application",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (

      <div className={inter.className}>
        <div className="flex flex-col h-screen">
          <AppHeader />
          <div className="flex flex-1 overflow-hidden">
            <AppSidebar />
            <main className="flex-1 h-full bg-background">
              <div className="h-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    
  );
}

