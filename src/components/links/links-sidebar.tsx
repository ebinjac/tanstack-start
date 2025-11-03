import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Link, useLocation } from '@tanstack/react-router'
import {
  Link2,
  Pin,
  Globe,
  Lock,
  Folder,
  Tag,
  Plus,
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  Search,
  Shield,
  Check,
  Upload
} from 'lucide-react'
import { serverGetCategories } from '@/lib/server/links'
import { CategoryManagement } from './category-management'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface LinksSidebarProps {
  teamId: string
  currentTeam: any
  teams: any[]
  applications: any[]
  className?: string
  onTeamChange?: (teamId: string) => void
}

interface SidebarSection {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
  defaultOpen?: boolean
  children?: SidebarSection[]
}

export function LinksSidebar({
  teamId,
  currentTeam,
  teams,
  applications,
  className,
  onTeamChange
}: LinksSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['applications']))
  const [categories, setCategories] = useState<any[]>([])
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] = useState(false)
  const location = useLocation()

  // Fetch categories when component mounts or teamId changes
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories for teamId:', teamId)
        const result = await serverGetCategories({ data: { teamId } })
        console.log('Categories result:', result)
        if (result.success) {
          console.log('Setting categories:', result.data || [])
          setCategories(result.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [teamId])

  // Build sections dynamically
  const sections: SidebarSection[] = [
    {
      id: 'all-links',
      label: 'All Links',
      icon: Link2,
    },
    {
      id: 'pinned-links',
      label: 'Pinned Links',
      icon: Pin,
    },
    {
      id: 'public-links',
      label: 'Public Links',
      icon: Globe,
    },
    {
      id: 'private-links',
      label: 'Private Links',
      icon: Lock,
    },
  ]

  // Add categories as a collapsible section (always show the section)
  const categoryChildren: SidebarSection[] = categories.map((category) => ({
    id: `category-${category.id}`,
    label: category.name,
    icon: Tag,
    count: Number(category.linkCount) || 0,
  }))

  // Always add "Add Category" as the first item
  categoryChildren.unshift({
    id: 'add-category',
    label: 'Add New Category',
    icon: Plus,
    count: undefined,
  })

  sections.push({
    id: 'categories',
    label: 'Categories',
    icon: Folder,
    defaultOpen: true,
    children: categoryChildren,
  })

  // Add applications section if there are applications
  if (applications && applications.length > 0) {
    sections.push({
      id: 'applications',
      label: 'Applications',
      icon: Folder,
      defaultOpen: true,
      children: applications.map((app) => ({
        id: `app-${app.id}`,
        label: app.tla || app.applicationName,
        icon: Building2,
      }))
    })
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleSectionClick = (sectionId: string) => {
    if (sectionId === 'add-category') {
      setIsCategoryManagementOpen(true)
      return
    }
    // Navigation is now handled by Link components, no need for callback
  }

  const handleCategoryCreated = (category: any) => {
    setCategories(prev => [...prev, category])
  }

  const handleCategoryUpdated = (category: any) => {
    setCategories(prev =>
      prev.map(cat => cat.id === category.id ? category : cat)
    )
  }

  const handleCategoryDeleted = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId))
  }

  const renderSection = (section: SidebarSection, level: number = 0) => {
    const isExpanded = expandedSections.has(section.id)
    const hasChildren = section.children && section.children.length > 0
    const isAddCategory = section.id === 'add-category'

    // Use location to determine if this section is active
    let isActive = false
    if (!isAddCategory && !hasChildren) {
      // Get the current pathname from TanStack Router's location
      const pathname = location.pathname
      
      if (section.id === 'all-links') {
        isActive = pathname.includes('/links/all-links')
      } else if (section.id === 'pinned-links') {
        isActive = pathname.includes('/links/pinned')
      } else if (section.id === 'public-links') {
        isActive = pathname.includes('/links/public')
      } else if (section.id === 'private-links') {
        isActive = pathname.includes('/links/private')
      } else if (section.id.startsWith('category-')) {
        const categoryId = section.id.replace('category-', '')
        isActive = pathname.includes(`/category/${categoryId}`)
      } else if (section.id.startsWith('app-')) {
        const applicationId = section.id.replace('app-', '')
        isActive = pathname.includes(`/application/${applicationId}`)
      }
    }


    // Create link props for navigation items
    const getLinkProps = () => {
      if (isAddCategory) return {}
      
      switch (section.id) {
        case 'all-links':
          return { to: '/team/$teamId/links/all-links', params: { teamId } as any }
        case 'pinned-links':
          return { to: '/team/$teamId/links/pinned', params: { teamId } as any }
        case 'public-links':
          return { to: '/team/$teamId/links/public', params: { teamId } as any }
        case 'private-links':
          return { to: '/team/$teamId/links/private', params: { teamId } as any }
        default:
          if (section.id.startsWith('category-')) {
            return { to: '/team/$teamId/links/category/$categoryId', params: { teamId, categoryId: section.id.replace('category-', '') } as any }
          } else if (section.id.startsWith('app-')) {
            return { to: '/team/$teamId/links/application/$applicationId', params: { teamId, applicationId: section.id.replace('app-', '') } as any }
          }
          return {}
      }
    }

    const linkProps = getLinkProps()

    const content = (
      <>
        {hasChildren && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-3 w-3" />
          </motion.div>
        )}
        <section.icon className={cn('h-4 w-4', isAddCategory && 'text-primary')} />
        <span className={cn('flex-1 text-left', isAddCategory && 'text-primary font-medium')}>
          {section.label}
        </span>
        {section.count !== undefined && section.count !== undefined && (
          <Badge variant="secondary" className="text-xs">
            {section.count}
          </Badge>
        )}
      </>
    )

    return (
      <div key={section.id} className="w-full">
        {hasChildren || isAddCategory ? (
          <Button
            variant={isAddCategory ? 'outline' : 'ghost'}
            className={cn(
              'w-full justify-start gap-2 h-8 px-2',
              level > 0 && 'ml-4',
              isAddCategory && 'border-dashed border-primary/50 hover:border-primary hover:bg-primary/5'
            )}
            onClick={() => {
              if (hasChildren) {
                toggleSection(section.id)
              } else {
                handleSectionClick(section.id)
              }
            }}
          >
            {content}
          </Button>
        ) : (
          <Link
            {...linkProps}
          >
            <Button
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-2 h-8 px-2',
                level > 0 && 'ml-4'
              )}
            >
              {content}
            </Button>
          </Link>
        )}

        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {section.children?.map((child) => renderSection(child, level + 1))}
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-background border-r', className)}>
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Links</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8">
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
        
        {/* Team Switcher */}
        <SidebarTeamSwitcher
          teams={teams}
          currentTeam={currentTeam}
          onTeamChange={onTeamChange || (() => {})}
        />

      </div>

      <Separator />

      {/* Import Links */}
      <div className="p-2">
        <Link
          to="/team/$teamId/links/import"
          params={{ teamId }}
        >
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 px-2 text-sm"
          >
            <Upload className="h-4 w-4" />
            Import Links
          </Button>
        </Link>
      </div>

      <Separator />

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {sections.map((section) => renderSection(section))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start"
            onClick={() => setIsCategoryManagementOpen(true)}
          >
            <Folder className="h-3 w-3 mr-2" />
            Manage Categories
          </Button>
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Total Links</span>
              <span>24</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated</span>
              <span>2 min ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Management Dialog */}
      <CategoryManagement
        teamId={teamId}
        open={isCategoryManagementOpen}
        onOpenChange={setIsCategoryManagementOpen}
        onCategoryCreated={handleCategoryCreated}
        onCategoryUpdated={handleCategoryUpdated}
        onCategoryDeleted={handleCategoryDeleted}
      />
    </div>
  )
}

// Custom team switcher component for the sidebar
function SidebarTeamSwitcher({ teams, currentTeam, onTeamChange }: {
  teams: any[],
  currentTeam: any,
  onTeamChange?: (teamId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const hasTeams = teams.length > 0

  // Filter teams based on search input
  const filteredTeams = inputValue
    ? teams.filter(team =>
        team.teamName.toLowerCase().includes(inputValue.toLowerCase())
      )
    : teams

  if (!hasTeams) {
    return null
  }

  const getAccessIcon = (level: string) => {
    switch (level) {
      case 'admin':
        return <Shield className="h-3 w-3 text-primary" />
      case 'user':
        return <Users className="h-3 w-3 text-primary" />
      default:
        return <Building2 className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getAccessColor = (level: string) => {
    switch (level) {
      case 'admin':
        return 'bg-primary text-primary-foreground'
      case 'user':
        return 'bg-secondary text-secondary-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const handleTeamSelect = (team: any) => {
    onTeamChange?.(team.id)
    setOpen(false)
    setInputValue('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-xs h-8"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
            {currentTeam ? (
              <>
                {getAccessIcon(currentTeam.accessLevel)}
                <span className="truncate font-medium">
                  {currentTeam.teamName}
                </span>
              </>
            ) : (
              <>
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground truncate">Select team</span>
              </>
            )}
          </div>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start" side="bottom">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-2">
            <Search className="mr-1 h-3 w-3 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search teams..."
              value={inputValue}
              onValueChange={setInputValue}
              className="flex h-9 w-full rounded-md bg-transparent py-1 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0"
            />
          </div>
          <CommandList>
            {inputValue && filteredTeams.length === 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center justify-center py-4">
                  <Building2 className="h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">No teams found</p>
                </div>
              </CommandEmpty>
            )}

            {!inputValue && teams.length > 0 && (
              <CommandGroup heading="Your Teams" className="px-2 py-1 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  Active Teams ({teams.length})
                </div>
              </CommandGroup>
            )}

            {(inputValue ? filteredTeams : teams).map((team) => (
              <CommandItem
                key={team.id}
                value={team.id}
                onSelect={() => handleTeamSelect(team)}
                className="flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors hover:bg-accent focus:bg-accent group"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-secondary border">
                  {getAccessIcon(team.accessLevel)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-xs truncate">{team.teamName}</span>
                    {team.id === currentTeam?.id && (
                      <Check className="h-3 w-3 text-green-600 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-1 py-0", getAccessColor(team.accessLevel))}
                    >
                      {team.accessLevel}
                    </Badge>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}