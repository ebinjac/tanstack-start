// Team Access Indicator Component
// Displays the user's access level for a specific team

import { Badge } from '@/components/ui/badge'
import { Shield, Users, Crown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TeamAccessLevel } from '@/lib/server/auth'

interface TeamAccessIndicatorProps {
  accessLevel: TeamAccessLevel
  teamName?: string
  className?: string
  showIcon?: boolean
  variant?: 'default' | 'compact' | 'detailed'
}

/**
 * Component to display team access level with appropriate styling
 */
export function TeamAccessIndicator({
  accessLevel,
  teamName,
  className,
  showIcon = true,
  variant = 'default'
}: TeamAccessIndicatorProps) {
  // Get access level configuration
  const accessConfig = getAccessConfig(accessLevel)

  // Compact variant - just shows the badge
  if (variant === 'compact') {
    return (
      <Badge
        variant={accessLevel === 'none' ? 'destructive' : 'default'}
        className={cn(
          'flex items-center gap-1',
          accessConfig.className,
          className
        )}
      >
        {showIcon && <accessConfig.icon className="w-3 h-3" />}
        {accessConfig.label}
      </Badge>
    )
  }

  // Default variant - shows badge with team name
  if (variant === 'default') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showIcon && (
          <accessConfig.icon 
            className={cn('w-4 h-4', accessConfig.iconClassName)} 
          />
        )}
        <Badge
          variant={accessLevel === 'none' ? 'destructive' : 'default'}
          className={cn(accessConfig.className)}
        >
          {accessConfig.label}
        </Badge>
        {teamName && (
          <span className="text-sm text-gray-600">{teamName}</span>
        )}
      </div>
    )
  }

  // Detailed variant - shows full information
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border',
      accessLevel === 'admin' ? 'bg-purple-50 border-purple-200' :
      accessLevel === 'user' ? 'bg-green-50 border-green-200' :
      'bg-red-50 border-red-200',
      className
    )}>
      {showIcon && (
        <div className={cn(
          'p-2 rounded-full',
          accessLevel === 'admin' ? 'bg-purple-100' :
          accessLevel === 'user' ? 'bg-green-100' :
          'bg-red-100'
        )}>
          <accessConfig.icon 
            className={cn(
              'w-4 h-4',
              accessLevel === 'admin' ? 'text-purple-600' :
              accessLevel === 'user' ? 'text-green-600' :
              'text-red-600'
            )} 
          />
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant={accessLevel === 'none' ? 'destructive' : 'default'}
            className={cn(accessConfig.className)}
          >
            {accessConfig.label}
          </Badge>
          {teamName && (
            <span className="font-medium text-gray-900">{teamName}</span>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {accessConfig.description}
        </p>
      </div>
    </div>
  )
}

/**
 * Get configuration for each access level
 */
function getAccessConfig(accessLevel: TeamAccessLevel) {
  switch (accessLevel) {
    case 'admin':
      return {
        label: 'Admin',
        description: 'Full administrative access to team resources',
        icon: Crown,
        className: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
        iconClassName: 'text-purple-600',
      }
    
    case 'user':
      return {
        label: 'User',
        description: 'Standard read and write access to team resources',
        icon: Users,
        className: 'bg-green-100 text-green-800 hover:bg-green-200',
        iconClassName: 'text-green-600',
      }
    
    case 'none':
    default:
      return {
        label: 'No Access',
        description: 'No access to team resources',
        icon: AlertCircle,
        className: 'bg-red-100 text-red-800 hover:bg-red-200',
        iconClassName: 'text-red-600',
      }
  }
}

/**
 * Props for TeamAccessList component
 */
interface TeamAccessListProps {
  teams: Array<{
    id: string
    teamName: string
    accessLevel: TeamAccessLevel
  }>
  className?: string
  showDetails?: boolean
}

/**
 * Component to display a list of teams with their access levels
 */
export function TeamAccessList({ 
  teams, 
  className, 
  showDetails = false 
}: TeamAccessListProps) {
  if (teams.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No team access available</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {teams.map((team) => (
        <TeamAccessIndicator
          key={team.id}
          accessLevel={team.accessLevel}
          teamName={team.teamName}
          variant={showDetails ? 'detailed' : 'default'}
        />
      ))}
    </div>
  )
}

/**
 * Component to show access level summary
 */
interface AccessSummaryProps {
  teams: Array<{
    id: string
    teamName: string
    accessLevel: TeamAccessLevel
  }>
  className?: string
}

export function AccessSummary({ teams, className }: AccessSummaryProps) {
  const adminCount = teams.filter(t => t.accessLevel === 'admin').length
  const userCount = teams.filter(t => t.accessLevel === 'user').length
  const totalCount = teams.length

  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-gray-500" />
        <span className="text-gray-600">
          {totalCount} team{totalCount !== 1 ? 's' : ''}
        </span>
      </div>
      
      {adminCount > 0 && (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          <Crown className="w-3 h-3 mr-1" />
          {adminCount} admin
        </Badge>
      )}
      
      {userCount > 0 && (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Users className="w-3 h-3 mr-1" />
          {userCount} user
        </Badge>
      )}
    </div>
  )
}