import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db'
import { teams, teamRegistrationRequests, applications } from '@/db/schema/teams'
import { eq, and, desc, count, sql } from 'drizzle-orm'

// Zod schema for approving/rejecting requests
const ApproveRejectRequestSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  action: z.enum(['approve', 'reject']),
  comments: z.string().optional(),
})

export type ApproveRejectRequestInput = z.infer<typeof ApproveRejectRequestSchema>

// Server function to get all registration requests
export const serverGetAllRegistrationRequests = createServerFn()
  .handler(async () => {
    try {
      const requests = await db
        .select()
        .from(teamRegistrationRequests)
        .orderBy(desc(teamRegistrationRequests.requestedAt))

      return {
        success: true,
        data: requests,
        count: requests.length,
      }
    } catch (error) {
      console.error('Error fetching registration requests:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch registration requests')
    }
  })

// Server function to get registration requests by status
export const serverGetRegistrationRequestsByStatus = createServerFn()
  .inputValidator(z.object({ status: z.enum(['pending', 'approved', 'rejected']) }))
  .handler(async ({ data }) => {
    try {
      const requests = await db
        .select()
        .from(teamRegistrationRequests)
        .where(eq(teamRegistrationRequests.status, data.status))
        .orderBy(desc(teamRegistrationRequests.requestedAt))

      return {
        success: true,
        data: requests,
        count: requests.length,
      }
    } catch (error) {
      console.error('Error fetching registration requests by status:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch registration requests')
    }
  })

// Server function to approve or reject a registration request
export const serverApproveRejectRegistrationRequest = createServerFn()
  .inputValidator(ApproveRejectRequestSchema)
  .handler(async ({ data }) => {
    try {
      const { requestId, action, comments } = data

      // Get the registration request
      const [request] = await db
        .select()
        .from(teamRegistrationRequests)
        .where(eq(teamRegistrationRequests.id, requestId))
        .limit(1)

      if (!request) {
        throw new Error('Registration request not found')
      }

      if (request.status !== 'pending') {
        throw new Error(`Cannot ${action} a request that is already ${request.status}`)
      }

      // Start a transaction
      const result = await db.transaction(async (tx) => {
        // Update the registration request status
        const [updatedRequest] = await tx
          .update(teamRegistrationRequests)
          .set({
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewedAt: new Date(),
            comments: comments || null,
          })
          .where(eq(teamRegistrationRequests.id, requestId))
          .returning()

        if (action === 'approve') {
          // Create the team from the registration request
          const [newTeam] = await tx
            .insert(teams)
            .values({
              teamName: request.teamName,
              userGroup: request.userGroup,
              adminGroup: request.adminGroup,
              contactName: request.contactName,
              contactEmail: request.contactEmail,
              isActive: true,
              createdBy: 'admin', // In a real implementation, this would be the admin user ID
            })
            .returning()

          return {
            request: updatedRequest,
            team: newTeam,
          }
        }

        return {
          request: updatedRequest,
          team: null,
        }
      })

      return {
        success: true,
        data: result,
        message: `Registration request ${action}d successfully`,
      }
    } catch (error) {
      console.error('Error approving/rejecting registration request:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to process registration request')
    }
  })

// Server function to get registration request details
export const serverGetRegistrationRequestDetails = createServerFn()
  .inputValidator(z.object({ requestId: z.string().uuid() }))
  .handler(async ({ data }) => {
    try {
      const [request] = await db
        .select()
        .from(teamRegistrationRequests)
        .where(eq(teamRegistrationRequests.id, data.requestId))
        .limit(1)

      if (!request) {
        throw new Error('Registration request not found')
      }

      return {
        success: true,
        data: request,
      }
    } catch (error) {
      console.error('Error fetching registration request details:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch registration request details')
    }
  })

// Server function to get dashboard statistics
export const serverGetAdminDashboardStats = createServerFn()
  .handler(async () => {
    try {
      // Get counts by status
      const [pendingCount] = await db
        .select({ count: count(teamRegistrationRequests.id) })
        .from(teamRegistrationRequests)
        .where(eq(teamRegistrationRequests.status, 'pending'))

      const [approvedCount] = await db
        .select({ count: count(teamRegistrationRequests.id) })
        .from(teamRegistrationRequests)
        .where(eq(teamRegistrationRequests.status, 'approved'))

      const [rejectedCount] = await db
        .select({ count: count(teamRegistrationRequests.id) })
        .from(teamRegistrationRequests)
        .where(eq(teamRegistrationRequests.status, 'rejected'))

      // Get recent requests
      const recentRequests = await db
        .select()
        .from(teamRegistrationRequests)
        .orderBy(desc(teamRegistrationRequests.requestedAt))
        .limit(5)

      return {
        success: true,
        data: {
          stats: {
            pending: Number(pendingCount.count),
            approved: Number(approvedCount.count),
            rejected: Number(rejectedCount.count),
            total: Number(pendingCount.count) + Number(approvedCount.count) + Number(rejectedCount.count),
          },
          recentRequests,
        },
      }
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch dashboard statistics')
    }
  })

// Server function to get all teams
export const serverGetAllTeams = createServerFn()
  .handler(async () => {
    try {
      const teamsData = await db
        .select({
          id: teams.id,
          teamName: teams.teamName,
          userGroup: teams.userGroup,
          adminGroup: teams.adminGroup,
          contactName: teams.contactName,
          contactEmail: teams.contactEmail,
          isActive: teams.isActive,
          createdBy: teams.createdBy,
          createdAt: teams.createdAt,
          updatedBy: teams.updatedBy,
          updatedAt: teams.updatedAt,
        })
        .from(teams)
        .orderBy(desc(teams.createdAt))

      return {
        success: true,
        data: teamsData,
        count: teamsData.length,
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch teams')
    }
  })

// Server function to get teams with member count
export const serverGetTeamsWithMemberCount = createServerFn()
  .handler(async () => {
    try {
      // First, let's try to get all teams without member count to see if the issue is with the subquery
      const basicTeams = await db
        .select({
          id: teams.id,
          teamName: teams.teamName,
          userGroup: teams.userGroup,
          adminGroup: teams.adminGroup,
          contactName: teams.contactName,
          contactEmail: teams.contactEmail,
          isActive: teams.isActive,
          createdBy: teams.createdBy,
          createdAt: teams.createdAt,
          updatedBy: teams.updatedBy,
          updatedAt: teams.updatedAt,
        })
        .from(teams)
        .orderBy(desc(teams.createdAt))

      // If we have teams, try to get member counts separately
      if (basicTeams.length > 0) {
        // Get application counts for each team
        const teamsWithCounts = await Promise.all(
          basicTeams.map(async (team) => {
            try {
              const [appCount] = await db
                .select({ count: count() })
                .from(applications)
                .where(eq(applications.teamId, team.id))

              return {
                ...team,
                memberCount: Number(appCount?.count || 0),
              }
            } catch (countError) {
              console.error(`Error counting applications for team ${team.id}:`, countError)
              return {
                ...team,
                memberCount: 0,
              }
            }
          })
        )

        return {
          success: true,
          data: teamsWithCounts,
          count: teamsWithCounts.length,
        }
      }

      return {
        success: true,
        data: basicTeams,
        count: basicTeams.length,
      }
    } catch (error) {
      console.error('Error fetching teams with member count:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch teams with member count')
    }
  })
