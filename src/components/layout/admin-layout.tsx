import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import EnsembleLogo from '@/components/ensemble-logo'
import {
  Building2,
  Users,
  Settings,
  Home,
  Menu,
  LayoutDashboard
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const sidebarItems = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    id: "dashboard",
    href: "/admin/dashboard",
  },
  {
    title: "Team Requests",
    icon: <Users className="h-5 w-5" />,
    id: "requests",
    href: "/admin/team-requests",
  },
  {
    title: "Teams",
    icon: <Building2 className="h-5 w-5" />,
    id: "teams",
    href: "/admin/teams",
  },
  {
    title: "Settings",
    icon: <Settings className="h-5 w-5" />,
    id: "settings",
    href: "/admin/settings",
  },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  // Get the current page ID from the pathname
  const currentPageId = sidebarItems.find(item => location.pathname === item.href)?.id || ''

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out bg-card border-r`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center'}`}>
              <div className="h-8 w-8">
                <EnsembleLogo />
              </div>
              {sidebarOpen && <span className="font-semibold">Ensemble</span>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  item.id === currentPageId ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                }`}
              >
                <div className={`${!sidebarOpen ? 'mx-auto' : ''}`}>
                  {item.icon}
                </div>
                {sidebarOpen && <span>{item.title}</span>}
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            {sidebarOpen ? (
              <div className="flex items-center justify-between">
                <Link to="/">
                  <Button variant="ghost" className="justify-start">
                    <Home className="h-5 w-5 mr-2" />
                    <span>Back to Home</span>
                  </Button>
                </Link>
                <ThemeToggle />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
                <Link to="/">
                  <Button variant="ghost" className="w-full justify-center">
                    <Home className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}