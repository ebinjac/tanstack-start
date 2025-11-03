// Auth hooks
// These hooks combine SSO user data with team access information

import { useSuspenseQuery } from '@tanstack/react-query'
import { useAuthBlueSSO } from './use-authblue-sso'
import {
  serverGetUserTeams,
  serverCheckTeamAccess,
  serverGetTeamByName,
  serverHasAdminAccess
} from '@/lib/server/auth'
import type { TeamWithAccess, TeamAccessLevel } from '@/lib/server/auth'

/**
 * Main auth hook that provides user information and team access
 * Uses Suspense to ensure immediate data display
 */
export function useAuth() {
  const { user, loading, error: ssoError } = useAuthBlueSSO()

  // Always call hooks in the same order, even if we might not use the results
  const userGroups = user?.groups || []

  // Get user teams with access levels - always call this hook
  const {
    data: teamsData,
    error: teamsError,
  } = useSuspenseQuery({
    queryKey: ['user-teams', userGroups],
    queryFn: () => serverGetUserTeams({ data: { userGroups } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Check if user has admin access to any team - always call this hook
  const {
    data: adminData,
  } = useSuspenseQuery({
    queryKey: ['admin-access', userGroups],
    queryFn: () => serverHasAdminAccess({ data: { userGroups } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Process data conditionally but return consistent structure
  const teams = teamsData?.data || []
  const hasAccess = teams.length > 0
  const isAdmin = adminData?.data || false

  // Determine the final error state
  const finalError = teamsData?.success === false ? new Error(teamsData.error || 'Failed to fetch user teams') : teamsError || ssoError

  return {
    user,
    teams,
    isLoading: loading,
    error: finalError,
    hasAccess,
    isAdmin,
  }
}


/**
 * Hook to check access level for a specific team
 */
export function useTeamAccess(teamId: string) {
  const { user, loading, error: ssoError } = useAuthBlueSSO()

  const userGroups = user?.groups || []

  // Always call this hook to maintain consistent hook order
  const {
    data: accessData,
    error,
  } = useSuspenseQuery({
    queryKey: ['team-access', teamId, userGroups],
    queryFn: () => serverCheckTeamAccess({
      data: { teamId, userGroups }
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Process data conditionally but return consistent structure
  const accessLevel = user && accessData?.data?.accessLevel ? accessData.data.accessLevel : 'none'
  const hasAccess = user && accessLevel !== 'none'
  const isAdmin = user && accessLevel === 'admin'

  return {
    accessLevel,
    hasAccess,
    isAdmin,
    isLoading: loading,
    error: error || ssoError,
  }
}


/**
 * Hook to get team information by name
 */
export function useTeamByName(teamName: string) {
  const {
    data,
    error,
  } = useSuspenseQuery({
    queryKey: ['team-by-name', teamName],
    queryFn: () => serverGetTeamByName({ data: { teamName } }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    team: data?.data || null,
    isLoading: false,
    error,
    notFound: data?.success === false,
  }
}

/**
 * Hook to get all teams for a user with a specific access level
 */
export function useTeamsByAccessLevel(accessLevel: TeamAccessLevel) {
  const { teams } = useAuth()

  const filteredTeams = teams.filter(team => team.accessLevel === accessLevel)

  return {
    teams: filteredTeams,
    count: filteredTeams.length,
    hasTeams: filteredTeams.length > 0,
  }
}

/**
 * Hook to check if user can perform admin actions
 */
export function useCanAdmin() {
  const { isAdmin, teams } = useAuth()

  // User can admin if they have admin access to any team
  const canAdmin = isAdmin || teams.some(team => team.accessLevel === 'admin')

  return {
    canAdmin,
    adminTeams: teams.filter(team => team.accessLevel === 'admin'),
  }
}

/**
 * Hook to get user's primary team (first team with access)
 */
export function usePrimaryTeam() {
  const { teams, hasAccess } = useAuth()

  const primaryTeam = hasAccess ? teams[0] : null

  return {
    primaryTeam,
    hasPrimaryTeam: !!primaryTeam,
  }
}

/**
 * Hook to check if user has access to multiple teams
 */
export function useMultiTeamAccess() {
  const { teams } = useAuth()

  const hasMultipleTeams = teams.length > 1
  const teamCount = teams.length

  return {
    hasMultipleTeams,
    teamCount,
    teams,
  }
}

/**
 * Hook to get user's display name
 */
export function useUserDisplayName() {
  const { user } = useAuth()

  // Always return the same structure, just with different values
  if (!user) {
    return {
      displayName: 'Guest',
      firstName: '',
      lastName: '',
      email: '',
    }
  }

  return {
    displayName: user.attributes.fullName || user.attributes.firstName,
    firstName: user.attributes.firstName,
    lastName: user.attributes.lastName,
    email: user.attributes.email,
  }
}

/**
 * Hook to get user's groups for display
 */
export function useUserGroups() {
  const { user } = useAuth()

  const groups = user?.groups || []
  const primaryGroup = groups[0] || ''

  return {
    groups,
    primaryGroup,
    groupCount: groups.length,
    hasGroups: groups.length > 0,
  }
}