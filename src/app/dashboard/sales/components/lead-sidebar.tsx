import { Home, TrendingUp, Layout, Phone, Users, HelpCircle, Briefcase } from "lucide-react"

export function LeadSidebar() {
  const menuItems = [
    { icon: Home, label: "Dashboard", active: false },
    { icon: TrendingUp, label: "Advisory", active: false },
    { icon: Layout, label: "Website", active: false },
    { icon: Phone, label: "Sales hub", active: true },
    { icon: Users, label: "Clients", active: false },
    { icon: HelpCircle, label: "Support", active: false },
    { icon: Briefcase, label: "Employee", active: false },
    { icon: Layout, label: "Research", active: false },
  ]

  return (
    <div className="w-20 bg-white border-r flex flex-col items-center py-6">
      <div className="mb-8">
        <div className="w-10 h-10 rounded-md bg-blue-500 flex items-center justify-center text-white font-bold">F</div>
      </div>
      <nav className="flex-1 w-full">
        <ul className="space-y-6">
          {menuItems.map((item, index) => (
            <li key={index} className="flex flex-col items-center">
              <a
                href="#"
                className={`flex flex-col items-center justify-center w-full px-2 py-2 text-xs ${
                  item.active ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-center">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

