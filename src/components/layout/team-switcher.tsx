import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { useAuthContext } from '@/contexts/auth-context'
import {
  Building2,
  Search,
  Plus,
  Users,
  Shield,
  ChevronDown,
  Sparkles,
  Settings,
  Check
} from 'lucide-react'

interface Team {
  id: string
  teamName: string
  accessLevel: string
  userCount?: number
}

interface TeamSwitcherProps {
  teams: Team[]
  currentTeam?: Team | null
  onTeamChange?: (teamId: string) => void
}

export function TeamSwitcher({ teams, currentTeam, onTeamChange }: TeamSwitcherProps) {
  const router = useRouter()
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
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="outline"
          className="gap-2 border-dashed hover:border-solid"
          onClick={() => router.navigate({ to: '/team/register' })}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Team</span>
          <span className="sm:hidden">Team</span>
        </Button>
      </motion.div>
    )
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

  const handleTeamSelect = (team: Team) => {
    onTeamChange?.(team.id)
    setOpen(false)
    setInputValue('')
  }

  const handleTeamSettings = (team: Team, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(false)
    setInputValue('')
    
    // Navigate to team dashboard
    router.navigate({
      to: '/team/$teamId/dashboard',
      params: { teamId: team.id }
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full sm:w-[280px] justify-between "
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {currentTeam ? (
                <>
                  {getAccessIcon(currentTeam.accessLevel)}
                  <span className="truncate font-medium">
                    {currentTeam.teamName}
                  </span>
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Select a team</span>
                </>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full sm:w-[380px] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search teams..."
                value={inputValue}
                onValueChange={setInputValue}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0"
              />
            </div>
            <CommandList>
              {inputValue && filteredTeams.length === 0 && (
                <CommandEmpty>
                  <div className="flex flex-col items-center justify-center py-6">
                    <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No teams found</p>
                    <p className="text-xs text-muted-foreground/70">Try a different search term</p>
                  </div>
                </CommandEmpty>
              )}

              {!inputValue && teams.length > 0 && (
                <CommandGroup heading="Your Teams" className="px-2 py-2 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Active Teams ({teams.length})
                  </div>
                </CommandGroup>
              )}

              {(inputValue ? filteredTeams : teams).map((team) => (
                <CommandItem
                  key={team.id}
                  value={team.id}
                  onSelect={() => handleTeamSelect(team)}
                  className="flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors hover:bg-accent focus:bg-accent group"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary border">
                    {getAccessIcon(team.accessLevel)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{team.teamName}</span>
                      {team.id === currentTeam?.id && (
                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getAccessColor(team.accessLevel))}
                      >
                        {team.accessLevel}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleTeamSettings(team, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-accent mr-1"
                    title="Team Settings"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </button>
                </CommandItem>
              ))}

              {!inputValue && teams.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      router.navigate({ to: '/team/register' })
                    }}
                    className="flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors hover:bg-accent focus:bg-accent"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary border">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Create New Team</div>
                      <div className="text-xs text-muted-foreground/70">Set up a new team workspace</div>
                    </div>
                  </CommandItem>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </motion.div>
  )
}