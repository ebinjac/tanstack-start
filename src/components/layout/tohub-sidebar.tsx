// components/layout/tohub-sidebar.tsx

import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Home,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  Folder,
  FolderOpen,
  Bell,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { useFlaggedEntriesCount } from '@/hooks/use-flagging'

interface TohubSidebarProps {
  teamId: string
  isMobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  to: string
  badge?: number
  isActive?: boolean
  children?: React.ReactNode
}

function SidebarItem({ icon: Icon, label, to, badge, isActive, children }: SidebarItemProps) {
  return (
    <Link to={to}>
      <div 
        className={cn(
          "flex items-center justify-between w-full p-2 rounded-md transition-colors",
          isActive 
            ? "bg-blue-100 text-blue-700" 
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {badge !== undefined && (
          <Badge variant={isActive ? "default" : "secondary"} className="ml-auto">
            {badge}
          </Badge>
        )}
      </div>
    </Link>
  )
}

interface SidebarGroupProps {
  title: string
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
}

function SidebarGroup({ title, children, isOpen, onToggle }: SidebarGroupProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center justify-between w-full p-2 text-gray-700 hover:bg-gray-100"
        >
          <span className="text-sm font-medium">{title}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 mt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function TohubSidebar({ teamId, isMobileOpen, onMobileOpenChange }: TohubSidebarProps) {
  const location = useLocation()
  const [isTurnoverHubOpen, setIsTurnoverHubOpen] = useState(true)
  const [isManagementOpen, setIsManagementOpen] = useState(false)

  // Get flagged entries count
  const { flaggedCounts } = useFlaggedEntriesCount(teamId)
  const totalFlagged = flaggedCounts.reduce((sum, item) => sum + item.count, 0)

  // Check if a route is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={() => onMobileOpenChange?.(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Turnover Hub</h2>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => onMobileOpenChange?.(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Home */}
            <SidebarItem
              icon={Home}
              label="Dashboard"
              to={`/team/${teamId}/dashboard`}
              isActive={isActive(`/team/${teamId}/dashboard`)}
            />

            {/* Turnover Hub */}
            <SidebarGroup
              title="Turnover Hub"
              isOpen={isTurnoverHubOpen}
              onToggle={() => setIsTurnoverHubOpen(!isTurnoverHubOpen)}
            >
              <div className="ml-2 space-y-1">
                <SidebarItem
                  icon={FileText}
                  label="Pass the Baton"
                  to={`/team/${teamId}/tohub/pass-the-baton`}
                  isActive={isActive(`/team/${teamId}/tohub/pass-the-baton`)}
                />
                <SidebarItem
                  icon={FileText}
                  label="View Turnover Hub"
                  to={`/team/${teamId}/tohub/view-turnover-hub`}
                  isActive={isActive(`/team/${teamId}/tohub/view-turnover-hub`)}
                />
                <SidebarItem
                  icon={Calendar}
                  label="Turnover History"
                  to={`/team/${teamId}/tohub/turnover-history`}
                  isActive={isActive(`/team/${teamId}/tohub/turnover-history`)}
                />
                <SidebarItem
                  icon={BarChart3}
                  label="Statistics"
                  to={`/team/${teamId}/tohub/statistics`}
                  isActive={isActive(`/team/${teamId}/tohub/statistics`)}
                />
                <SidebarItem
                  icon={Settings}
                  label="Automation"
                  to={`/team/${teamId}/tohub/automation`}
                  isActive={isActive(`/team/${teamId}/tohub/automation`)}
                  badge={totalFlagged > 0 ? totalFlagged : undefined}
                />
                <SidebarItem
                  icon={Folder}
                  label="Sub-Applications"
                  to={`/team/${teamId}/tohub/sub-applications`}
                  isActive={isActive(`/team/${teamId}/tohub/sub-applications`)}
                />
              </div>
            </SidebarGroup>

            {/* Management */}
            <SidebarGroup
              title="Management"
              isOpen={isManagementOpen}
              onToggle={() => setIsManagementOpen(!isManagementOpen)}
            >
              <div className="ml-2 space-y-1">
                <SidebarItem
                  icon={Folder}
                  label="Applications"
                  to={`/team/${teamId}/applications/manage`}
                  isActive={isActive(`/team/${teamId}/applications/manage`)}
                />
              </div>
            </SidebarGroup>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Actions
              </h3>
              <div className="space-y-1">
                <Link to={`/team/${teamId}/tohub/pass-the-baton`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    New Turnover
                  </Button>
                </Link>
                <Link to={`/team/${teamId}/tohub/automation`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Check Alerts
                    {totalFlagged > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {totalFlagged}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Last sync: Just now</span>
            </div>
            {totalFlagged > 0 && (
              <div className="flex items-center gap-2 mt-2 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                <span>{totalFlagged} flagged items</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Mobile menu button
export function TohubSidebarMobileButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="lg:hidden"
      onClick={onClick}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  )
}