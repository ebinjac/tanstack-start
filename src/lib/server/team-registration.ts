import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { db } from '@/db'
import { teams, teamRegistrationRequests } from '@/db/schema/teams'
import { eq, and, desc } from 'drizzle-orm'
import type { SSOUser } from '@/hooks/use-authblue-sso'

// Zod schema for team registration validation
export const TeamRegistrationSchema = z.object({
  teamName: z.string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be less than 100 characters'),
  userGroup: z.string()
    .min(1, 'User group is required')
    .max(100, 'User group must be less than 100 characters'),
  adminGroup: z.string()
    .min(1, 'Admin group is required')
    .max(100, 'Admin group must be less than 100 characters'),
  contactName: z.string()
    .min(1, 'Contact name is required')
    .max(100, 'Contact name must be less than 100 characters'),
  contactEmail: z.string()
    .min(1, 'Contact email is required')
    .max(255, 'Contact email must be less than 255 characters')
    .email('Invalid email address'),
})

export type TeamRegistrationInput = z.infer<typeof TeamRegistrationSchema>

// Helper function to get current user from session
async function getCurrentUser(): Promise<SSOUser | null> {
  // This is a placeholder - in a real implementation, you'd get the user from session/cookies
  // For now, we'll return a mock user or throw an error if no auth context
  throw new Error('Authentication context not available on server side')
}

// Server function to create team registration request
export const serverCreateTeamRegistration = createServerFn({ method: 'POST' })
  .inputValidator(TeamRegistrationSchema)
  .handler(async ({ data }) => {
    try {
      // For now, we'll use a placeholder user ID
      // In a real implementation, you'd get this from the authenticated session
      const userId = data.contactEmail // Temporary workaround

      // Check if team name already exists in registration requests
      const existingRequest = await db.select()
        .from(teamRegistrationRequests)
        .where(eq(teamRegistrationRequests.teamName, data.teamName))
        .limit(1)

      if (existingRequest.length > 0) {
        throw new Error('A registration request for this team name already exists')
      }

      // Check if team name already exists in approved teams
      const existingTeam = await db.select()
        .from(teams)
        .where(eq(teams.teamName, data.teamName))
        .limit(1)

      if (existingTeam.length > 0) {
        throw new Error('A team with this name already exists')
      }

      // Create team registration request
      const registrationRequest = await db.insert(teamRegistrationRequests)
        .values({
          ...data,
          requestedBy: userId,
          status: 'pending',
        })
        .returning()

      return {
        success: true,
        data: registrationRequest[0],
        message: 'Team registration request submitted successfully. Awaiting admin approval.'
      }
    } catch (error) {
      console.error('Error creating team registration:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to create team registration request')
    }
  })

// Server function to get registration request by ID
export const serverGetRegistrationRequest = createServerFn()
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    try {
      // For now, we'll use a placeholder user ID
      const userId = 'placeholder-user-id' // Temporary workaround

      const request = await db.select()
        .from(teamRegistrationRequests)
        .where(
          and(
            eq(teamRegistrationRequests.id, data.id),
            eq(teamRegistrationRequests.requestedBy, userId)
          )
        )
        .limit(1)

      if (request.length === 0) {
        throw new Error('Registration request not found')
      }

      return request[0]
    } catch (error) {
      console.error('Error fetching registration request:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch registration request')
    }
  })

// Server function to get user's registration requests
export const serverGetUserRegistrationRequests = createServerFn()
  .handler(async () => {
    try {
      // For now, we'll use a placeholder user ID
      const userId = 'placeholder-user-id' // Temporary workaround

      const requests = await db.select()
        .from(teamRegistrationRequests)
        .where(eq(teamRegistrationRequests.requestedBy, userId))
        .orderBy(desc(teamRegistrationRequests.requestedAt))

      return requests
    } catch (error) {
      console.error('Error fetching user registration requests:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch registration requests')
    }
  })