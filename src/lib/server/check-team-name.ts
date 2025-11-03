import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db'
import { teams, teamRegistrationRequests } from '@/db/schema/teams'
import { eq, or } from 'drizzle-orm'

// Zod schema for team name validation
const CheckTeamNameSchema = z.object({
  teamName: z.string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be less than 100 characters'),
})

export type CheckTeamNameInput = z.infer<typeof CheckTeamNameSchema>

// Server function to check if team name is available
export const serverCheckTeamNameAvailability = createServerFn()
  .inputValidator(CheckTeamNameSchema)
  .handler(async ({ data }) => {
    try {
      const { teamName } = data

      // Check if team name already exists in approved teams
      const existingTeam = await db.select()
        .from(teams)
        .where(eq(teams.teamName, teamName))
        .limit(1)

      if (existingTeam.length > 0) {
        return {
          available: false,
          message: 'A team with this name already exists',
          type: 'error' as const
        }
      }

      // Check if team name already exists in registration requests
      const existingRequest = await db.select()
        .from(teamRegistrationRequests)
        .where(eq(teamRegistrationRequests.teamName, teamName))
        .limit(1)

      if (existingRequest.length > 0) {
        return {
          available: false,
          message: 'A registration request for this team name already exists',
          type: 'warning' as const
        }
      }

      return {
        available: true,
        message: 'Team name is available',
        type: 'success' as const
      }
    } catch (error) {
      console.error('Error checking team name availability:', error)
      return {
        available: false,
        message: 'Failed to check team name availability',
        type: 'error' as const
      }
    }
  })