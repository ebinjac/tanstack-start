import * as React from "react"
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import EnsembleLogo from '@/components/ensemble-logo'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TeamSwitcher } from '@/components/layout/team-switcher'
import { useAuthContext } from '@/contexts/auth-context'
import {
  Building2,
  LayoutDashboard,
  ClipboardList,
  Link2,
  Users,
  BookOpen,
  Info,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Shield
} from 'lucide-react'

export function MainHeader() {
  // Use try-catch to handle cases where AuthProvider might not be available
  const { user, teams, hasAccess } = (() => {
    try {
      return useAuthContext()
    } catch (error) {
      console.error('AuthContext not available:', error)
      return { user: null, teams: [], hasAccess: false }
    }
  })()

  const [currentTeam, setCurrentTeam] = useState<{ id: string; teamName: string } | undefined>()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Set default team when teams are available
  useEffect(() => {
    if (teams.length > 0 && !currentTeam) {
      const defaultTeam = teams.find(team => team.accessLevel !== 'none') || teams[0]
      if (defaultTeam) {
        setCurrentTeam({ id: defaultTeam.id, teamName: defaultTeam.teamName })
      }
    }
  }, [teams, currentTeam])

  const handleTeamChange = (teamId: string) => {
    const team = teams.find(t => t.id === teamId)
    if (team) {
      setCurrentTeam({ id: team.id, teamName: team.teamName })
    }
  }

  const teamsForSwitcher = teams.map(team => ({
    ...team,
    userCount: Math.floor(Math.random() * 20) + 5 // Mock user count
  }))

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
        isScrolled && "shadow-sm"
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo - Left */}
        <motion.div
          className="flex items-center gap-4"
          whileHover={{ scale: 1.02 }}
        >
          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <motion.div
              className="h-8 w-8"
              whileHover={{ rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <EnsembleLogo />
            </motion.div>
            <span className="font-bold text-xl hidden sm:block">Ensemble</span>
            <span className="font-bold text-xl sm:hidden">E</span>
          </Link>
        </motion.div>

        {/* Navigation - Middle (Desktop Only) */}
        <nav className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList>
              {/* Tools Navigation */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <motion.a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-muted p-6 no-underline outline-none focus:shadow-md"
                          href={`/team/${currentTeam?.id}/dashboard`}
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="mb-2 mt-4 text-lg font-medium">
                            Operations Hub
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Manage your team's reliability operations and tools in one place.
                          </p>
                        </motion.a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to={`/team/${currentTeam?.id}/scorecard`}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium leading-none">
                            <ClipboardList className="h-4 w-4" />
                            Scorecard
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Track and manage team metrics and performance indicators.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to={`/team/${currentTeam?.id}/links`}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium leading-none">
                            <Link2 className="h-4 w-4" />
                            Link Manager
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Manage notification links and external integrations.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to={`/team/${currentTeam?.id}/turnover`}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium leading-none">
                            <Users className="h-4 w-4" />
                            Turnover
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Manage shift handover and team transitions.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Resources Navigation */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-6 md:w-[500px] md:grid-cols-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/docs"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium leading-none">
                            <BookOpen className="h-4 w-4" />
                            Documentation
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Comprehensive guides and API documentation.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/about"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium leading-none">
                            <Info className="h-4 w-4" />
                            About Ensemble
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Learn more about our mission and features.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Right Section - Team Switcher, Theme, User */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Team Switcher - Desktop */}
          <div className="hidden sm:block">
            <TeamSwitcher
              teams={teamsForSwitcher}
              currentTeam={currentTeam}
              onTeamChange={handleTeamChange}
            />
          </div>

          {/* User Avatar */}
          {user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.attributes.avatar} alt={user.attributes.firstName} />
                      <AvatarFallback>
                        {user.attributes.firstName?.charAt(0)}{user.attributes.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {user.attributes.firstName} {user.attributes.lastName}
                      </p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.attributes.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                    <Link to="/admin/team-requests">
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="border-t bg-background md:hidden"
        >
          <div className="container px-4 py-4 space-y-4">
            {/* Mobile Team Switcher */}
            <div className="sm:hidden mb-4">
              <TeamSwitcher
                teams={teamsForSwitcher}
                currentTeam={currentTeam}
                onTeamChange={handleTeamChange}
              />
            </div>

            {/* Mobile Navigation */}
            <div className="space-y-3">
              <Link
                to={`/team/${currentTeam?.id}/dashboard`}
                className="flex items-center gap-3 text-lg font-medium p-3 rounded-md hover:bg-accent transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
              <Link
                to={`/team/${currentTeam?.id}/scorecard`}
                className="flex items-center gap-3 text-lg font-medium p-3 rounded-md hover:bg-accent transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ClipboardList className="h-5 w-5" />
                Scorecard
              </Link>
              <Link
                to={`/team/${currentTeam?.id}/links`}
                className="flex items-center gap-3 text-lg font-medium p-3 rounded-md hover:bg-accent transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link2 className="h-5 w-5" />
                Link Manager
              </Link>
              <Link
                to={`/team/${currentTeam?.id}/turnover`}
                className="flex items-center gap-3 text-lg font-medium p-3 rounded-md hover:bg-accent transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users className="h-5 w-5" />
                Turnover
              </Link>
              <div className="border-t pt-3">
                <Link
                  to="/docs"
                  className="flex items-center gap-3 text-lg font-medium p-3 rounded-md hover:bg-accent transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <BookOpen className="h-5 w-5" />
                  Documentation
                </Link>
                <Link
                  to="/about"
                  className="flex items-center gap-3 text-lg font-medium p-3 rounded-md hover:bg-accent transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Info className="h-5 w-5" />
                  About
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}