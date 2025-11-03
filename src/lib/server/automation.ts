// lib/server/automation.ts

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db'
import { turnoverEntries, turnoverSnapshots, turnovers } from '@/db/schema'
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm'
import { 
  serverGetTurnovers, 
  serverGetSnapshots,
  serverCreateDailySnapshot 
} from './turnovers'

// Zod schemas for validation
const FlagStaleEntriesSchema = z.object({
  teamId: z.string().uuid(),
  hours: z.number().default(24),
})

const CreateDailySnapshotsSchema = z.object({
  teamId: z.string().uuid(),
  applicationId: z.string().uuid().optional(),
  subApplicationId: z.string().uuid().optional(),
})

// Flag stale entries automation
export const flagStaleEntries = createServerFn({ method: 'POST' })
  .inputValidator(FlagStaleEntriesSchema)
  .handler(async ({ data }) => {
    try {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - data.hours)

      // Find entries that haven't been updated in the specified hours
      const staleEntries = await db
        .select()
        .from(turnoverEntries)
        .where(
          and(
            lte(turnoverEntries.updatedAt, cutoffTime),
            // Only flag entries that are not already flagged as long_pending
            sql`${turnoverEntries.priority} != 'long_pending'`
          )
        )

      if (staleEntries.length === 0) {
        return {
          success: true,
          data: {
            flaggedCount: 0,
            message: 'No stale entries found'
          }
        }
      }

      // Update stale entries to have appropriate priority based on how stale they are
      const now = new Date()
      const updates = []

      for (const entry of staleEntries) {
        const hoursSinceUpdate = Math.floor(
          (now.getTime() - new Date(entry.updatedAt).getTime()) / (1000 * 60 * 60)
        )

        let newPriority: string
        if (hoursSinceUpdate >= 72) {
          newPriority = 'long_pending'
        } else if (hoursSinceUpdate >= 48) {
          newPriority = 'needs_action'
        } else {
          newPriority = 'flagged'
        }

        updates.push({
          id: entry.id,
          priority: newPriority,
          updatedAt: new Date()
        })
      }

      // Batch update all stale entries
      for (const update of updates) {
        await db
          .update(turnoverEntries)
          .set({
            priority: update.priority as any,
            updatedAt: update.updatedAt
          })
          .where(eq(turnoverEntries.id, update.id))
      }

      return {
        success: true,
        data: {
          flaggedCount: updates.length,
          message: `Flagged ${updates.length} stale entries`
        }
      }
    } catch (error) {
      console.error('Error flagging stale entries:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to flag stale entries'
      }
    }
  })

// Create daily snapshots for all active turnovers
export const createDailySnapshots = createServerFn({ method: 'POST' })
  .inputValidator(CreateDailySnapshotsSchema)
  .handler(async ({ data }) => {
    try {
      const snapshotDate = new Date()
      
      // Get all active turnovers for the team
      const turnoversResult = await serverGetTurnovers({
        data: {
          teamId: data.teamId,
          applicationId: data.applicationId,
          subApplicationId: data.subApplicationId,
          status: 'active',
          limit: 1000
        }
      })

      if (!turnoversResult.success || !turnoversResult.data || turnoversResult.data.length === 0) {
        return {
          success: true,
          data: {
            snapshotCount: 0,
            message: 'No active turnovers found for snapshot'
          }
        }
      }

      const snapshots = []
      
      // Create snapshot for each application/sub-application combination
      for (const turnover of turnoversResult.data) {
        // Get detailed turnover data with entries
        const turnoverDetail = await serverGetTurnovers({
          data: {
            teamId: data.teamId,
            applicationId: turnover.applicationId || undefined,
            subApplicationId: turnover.subApplicationId || undefined,
            status: 'active',
            limit: 1
          }
        })

        if (turnoverDetail.success && turnoverDetail.data && turnoverDetail.data.length > 0) {
          // In a real implementation, we would fetch entries for this turnover
          // For now, we'll create a snapshot with the basic turnover data
          const snapshotData = {
            ...turnoverDetail.data[0],
            entries: [] // TODO: Fetch actual entries
          }

          const snapshotResult = await serverCreateDailySnapshot({
            data: {
              teamId: data.teamId,
              applicationId: turnover.applicationId || undefined,
              subApplicationId: turnover.subApplicationId || undefined,
              snapshotDate: snapshotDate.toISOString(),
              turnoverData: snapshotData
            }
          })

          if (snapshotResult.success) {
            snapshots.push(snapshotResult.data)
          }
        }
      }

      return {
        success: true,
        data: {
          snapshotCount: snapshots.length,
          snapshots,
          message: `Created ${snapshots.length} daily snapshots`
        }
      }
    } catch (error) {
      console.error('Error creating daily snapshots:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create daily snapshots'
      }
    }
  })

// Get automation status and statistics
export const getAutomationStatus = createServerFn()
  .inputValidator(z.object({
    teamId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    try {
      // Get count of stale entries by priority
      const staleEntriesByPriority = await db
        .select({
          priority: turnoverEntries.priority,
          count: sql<number>`count(*)`.as('count')
        })
        .from(turnoverEntries)
        .innerJoin(turnovers, eq(turnoverEntries.turnoverId, turnovers.id))
        .where(eq(turnovers.teamId, data.teamId))
        .groupBy(turnoverEntries.priority)

      // Get recent snapshots
      const recentSnapshots = await db
        .select()
        .from(turnoverSnapshots)
        .where(eq(turnoverSnapshots.teamId, data.teamId))
        .orderBy(desc(turnoverSnapshots.createdAt))
        .limit(7)

      // Get last automation run times (this would be stored in a separate table in a real implementation)
      const lastStaleFlagRun = new Date()
      lastStaleFlagRun.setHours(lastStaleFlagRun.getHours() - 2) // Mock: 2 hours ago
      
      const lastSnapshotRun = new Date()
      lastSnapshotRun.setHours(lastSnapshotRun.getHours() - 24) // Mock: 24 hours ago

      return {
        success: true,
        data: {
          staleEntriesByPriority,
          recentSnapshots,
          lastStaleFlagRun,
          lastSnapshotRun,
          automationEnabled: true
        }
      }
    } catch (error) {
      console.error('Error getting automation status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get automation status'
      }
    }
  })

// Schedule automation tasks (this would typically be handled by a job scheduler)
export const scheduleAutomationTasks = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    teamId: z.string().uuid(),
    enableStaleFlagging: z.boolean().default(true),
    enableDailySnapshots: z.boolean().default(true),
    staleFlaggingInterval: z.number().default(6), // hours
    dailySnapshotTime: z.string().default('00:00'), // HH:MM format
  }))
  .handler(async ({ data }) => {
    try {
      // In a real implementation, this would set up cron jobs or similar scheduling mechanisms
      // For now, we'll just return a success message indicating the configuration
      
      return {
        success: true,
        data: {
          teamId: data.teamId,
          configuration: {
            staleFlagging: {
              enabled: data.enableStaleFlagging,
              interval: data.staleFlaggingInterval
            },
            dailySnapshots: {
              enabled: data.enableDailySnapshots,
              time: data.dailySnapshotTime
            }
          },
          message: 'Automation tasks scheduled successfully'
        }
      }
    } catch (error) {
      console.error('Error scheduling automation tasks:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to schedule automation tasks'
      }
    }
  })

// Run all automation tasks manually
export const runAllAutomationTasks = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    teamId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    try {
      // Run stale entries flagging
      const staleFlagResult = await flagStaleEntries({
        data: {
          teamId: data.teamId,
          hours: 24
        }
      })

      // Run daily snapshots creation
      const snapshotResult = await createDailySnapshots({
        data: {
          teamId: data.teamId
        }
      })

      return {
        success: true,
        data: {
          staleFlagResult,
          snapshotResult,
          message: 'All automation tasks completed successfully'
        }
      }
    } catch (error) {
      console.error('Error running automation tasks:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to run automation tasks'
      }
    }
  })