// Auth server functions
// These functions handle authentication and authorization logic on the server

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db'
import { teams } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { SSOUser } from '@/hooks/use-authblue-sso'

// Zod schemas for validation
const GetUserTeamsSchema = z.object({
  userGroups: z.array(z.string()).optional().default([]),
})

const CheckTeamAccessSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  userGroups: z.array(z.string()).optional().default([]),
})

const GetTeamByNameSchema = z.object({
  teamName: z.string().min(1, 'Team name is required').max(100),
})

// Types for team access levels
export type TeamAccessLevel = 'none' | 'user' | 'admin'

export type TeamWithAccess = {
  id: string
  teamName: string
  userGroup: string
  adminGroup: string
  contactName: string
  contactEmail: string
  isActive: boolean
  accessLevel: TeamAccessLevel
}

/**
 * Server function to get all teams with user access levels
 * Returns teams filtered by user's group membership with access levels
 */
export const serverGetUserTeams = createServerFn()
  .inputValidator(GetUserTeamsSchema)
  .handler(async ({ data }) => {
    try {
      // If no user groups provided, return empty result immediately
      if (!data.userGroups || data.userGroups.length === 0) {
        return {
          success: true,
          data: [],
          count: 0,
        }
      }

      // Get all active teams from database
      const allTeams = await db
        .select({
          id: teams.id,
          teamName: teams.teamName,
          userGroup: teams.userGroup,
          adminGroup: teams.adminGroup,
          contactName: teams.contactName,
          contactEmail: teams.contactEmail,
          isActive: teams.isActive,
        })
        .from(teams)
        .where(eq(teams.isActive, true))

      // Determine access level for each team based on user's groups
      const teamsWithAccess: TeamWithAccess[] = allTeams.map((team) => {
        let accessLevel: TeamAccessLevel = 'none'

        // Check if user is in admin group (highest priority)
        if (data.userGroups.includes(team.adminGroup)) {
          accessLevel = 'admin'
        }
        // Check if user is in user group
        else if (data.userGroups.includes(team.userGroup)) {
          accessLevel = 'user'
        }

        return {
          ...team,
          accessLevel,
        }
      })

      // Filter out teams with no access
      const accessibleTeams = teamsWithAccess.filter(
        (team) => team.accessLevel !== 'none'
      )

      return {
        success: true,
        data: accessibleTeams,
        count: accessibleTeams.length,
      }
    } catch (error) {
      console.error('Error fetching user teams:', error)
      return {
        success: false,
        data: [],
        count: 0,
        error: 'Failed to fetch user teams',
      }
    }
  })

/**
 * Server function to check access level for a specific team
 */
export const serverCheckTeamAccess = createServerFn()
  .inputValidator(CheckTeamAccessSchema)
  .handler(async ({ data }) => {
    try {
      // Get the specific team
      const [team] = await db
        .select({
          id: teams.id,
          teamName: teams.teamName,
          userGroup: teams.userGroup,
          adminGroup: teams.adminGroup,
          isActive: teams.isActive,
        })
        .from(teams)
        .where(
          and(
            eq(teams.id, data.teamId),
            eq(teams.isActive, true)
          )
        )

      if (!team) {
        return {
          success: false,
          error: 'Team not found or inactive',
          accessLevel: 'none' as TeamAccessLevel,
        }
      }

      // Determine access level
      let accessLevel: TeamAccessLevel = 'none'
      
      if (data.userGroups.includes(team.adminGroup)) {
        accessLevel = 'admin'
      } else if (data.userGroups.includes(team.userGroup)) {
        accessLevel = 'user'
      }

      return {
        success: true,
        data: {
          teamId: team.id,
          teamName: team.teamName,
          accessLevel,
        },
      }
    } catch (error) {
      console.error('Error checking team access:', error)
      throw new Error('Failed to check team access')
    }
  })

/**
 * Server function to get a team by name
 */
export const serverGetTeamByName = createServerFn()
  .inputValidator(GetTeamByNameSchema)
  .handler(async ({ data }) => {
    try {
      const [team] = await db
        .select({
          id: teams.id,
          teamName: teams.teamName,
          userGroup: teams.userGroup,
          adminGroup: teams.adminGroup,
          contactName: teams.contactName,
          contactEmail: teams.contactEmail,
          isActive: teams.isActive,
          createdAt: teams.createdAt,
        })
        .from(teams)
        .where(eq(teams.teamName, data.teamName))

      if (!team) {
        return {
          success: false,
          error: 'Team not found',
        }
      }

      return {
        success: true,
        data: team,
      }
    } catch (error) {
      console.error('Error fetching team by name:', error)
      throw new Error('Failed to fetch team')
    }
  })

/**
 * Server function to get all teams (admin only)
 * This function should be protected by auth middleware
 */
export const serverGetAllTeams = createServerFn()
  .handler(async () => {
    try {
      const allTeams = await db
        .select({
          id: teams.id,
          teamName: teams.teamName,
          userGroup: teams.userGroup,
          adminGroup: teams.adminGroup,
          contactName: teams.contactName,
          contactEmail: teams.contactEmail,
          isActive: teams.isActive,
          createdAt: teams.createdAt,
          createdBy: teams.createdBy,
        })
        .from(teams)
        .orderBy(teams.teamName)

      return {
        success: true,
        data: allTeams,
        count: allTeams.length,
      }
    } catch (error) {
      console.error('Error fetching all teams:', error)
      throw new Error('Failed to fetch teams')
    }
  })

/**
 * Helper function to determine if a user has admin access to any team
 * This can be used for UI decisions
 */
export const serverHasAdminAccess = createServerFn()
  .inputValidator(GetUserTeamsSchema)
  .handler(async ({ data }) => {
    try {
      // If no user groups provided, return false immediately
      if (!data.userGroups || data.userGroups.length === 0) {
        return {
          success: true,
          data: false,
        }
      }

      // Get all active teams with their admin groups
      const adminTeams = await db
        .select({ id: teams.id, adminGroup: teams.adminGroup })
        .from(teams)
        .where(eq(teams.isActive, true))

      // Check if user's group matches any team's admin group
      const hasAdmin = adminTeams.some((team) =>
        data.userGroups.includes(team.adminGroup)
      )

      return {
        success: true,
        data: hasAdmin,
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      return {
        success: false,
        data: false,
        error: 'Failed to check admin access',
      }
    }
  })