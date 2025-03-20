"use client"

import { Home, LineChart, Globe, Phone, Users, SmileIcon, Briefcase, BookOpen } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    title: "Advisory",
    icon: LineChart,
    href: "/dashboard/advisory",
  },
  {
    title: "Website",
    icon: Globe,
    href: "/dashboard/website",
  },
  {
    title: "Sales hub",
    icon: Phone,
    href: "/dashboard/sales",
  },
  {
    title: "Clients",
    icon: Users,
    href: "/dashboard/client",
  },
  {
    title: "Support",
    icon: SmileIcon,
    href: "/dashboard/support",
  },
  {
    title: "Employee",
    icon: Briefcase,
    href: "/dashboard/employee",
  },
  {
    title: "Research",
    icon: BookOpen,
    href: "/dashboard/research",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <nav className="w-24 border-r bg-white">
      <div className="flex flex-col items-center gap-6 py-6">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center transition-colors hover:text-purple-600 ${
                isActive ? "text-purple-600" : "text-gray-500"
              }`}
            >
              <div className={`relative flex h-12 w-24 items-center justify-center  ${
                isActive ? "bg-purple-100" : "hover:bg-gray-100"
              }`}>
                {isActive && (
                  <div className="absolute left-0 top-0 h-full w-1 rounded-r bg-purple-600" />
                )}
                <item.icon className="h-7 w-7" />
              </div>
              <span className="mt-1 text-xs font-medium text-center">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

