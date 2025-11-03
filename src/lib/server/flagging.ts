// lib/server/flagging.ts

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db'
import { turnoverEntries } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

// Zod schemas for validation
const FlagEntrySchema = z.object({
  entryId: z.string().uuid(),
  priority: z.enum(['normal', 'important', 'flagged', 'needs_action', 'long_pending']),
  comment: z.string().optional()
})

const GetFlaggedEntriesSchema = z.object({
  teamId: z.string().uuid(),
  applicationId: z.string().uuid().optional(),
  subApplicationId: z.string().uuid().optional(),
  priority: z.enum(['normal', 'important', 'flagged', 'needs_action', 'long_pending']).optional()
})

// Flag a turnover entry
export const flagEntry = createServerFn({ method: 'POST' })
  .inputValidator(FlagEntrySchema)
  .handler(async ({ data }) => {
    try {
      // Update the entry priority
      const [updatedEntry] = await db.update(turnoverEntries)
        .set({
          priority: data.priority,
          updatedAt: new Date()
        })
        .where(eq(turnoverEntries.id, data.entryId))
        .returning()

      if (!updatedEntry) {
        return {
          success: false,
          error: 'Entry not found',
          message: 'Failed to flag entry'
        }
      }

      return {
        success: true,
        data: updatedEntry,
        message: 'Entry flagged successfully'
      }
    } catch (error) {
      console.error('Error flagging entry:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to flag entry'
      }
    }
  })

// Get flagged entries for a team
export const getFlaggedEntries = createServerFn()
  .inputValidator(GetFlaggedEntriesSchema)
  .handler(async ({ data }) => {
    try {
      // Build the where clause
      const conditions = [
        // We'll need to join with turnovers to filter by teamId
        sql`${turnoverEntries.priority} != 'normal'`
      ]

      if (data.priority) {
        conditions.push(sql`${turnoverEntries.priority} = ${data.priority}`)
      }

      // In a real implementation, we would join with turnovers to filter by teamId, applicationId, and subApplicationId
      // For now, we'll just filter by priority
      const flaggedEntries = await db.select()
        .from(turnoverEntries)
        .where(and(...conditions))
        .orderBy(turnoverEntries.updatedAt)

      return {
        success: true,
        data: flaggedEntries,
        message: 'Flagged entries retrieved successfully'
      }
    } catch (error) {
      console.error('Error getting flagged entries:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get flagged entries'
      }
    }
  })

// Get flagged entries count by priority
export const getFlaggedEntriesCount = createServerFn()
  .inputValidator(z.object({
    teamId: z.string().uuid(),
    applicationId: z.string().uuid().optional(),
    subApplicationId: z.string().uuid().optional()
  }))
  .handler(async ({ data }) => {
    try {
      // Get count of flagged entries by priority
      const flaggedCounts = await db.select({
        priority: turnoverEntries.priority,
        count: sql<number>`count(*)`.as('count')
      })
        .from(turnoverEntries)
        .where(sql`${turnoverEntries.priority} != 'normal'`)
        .groupBy(turnoverEntries.priority)

      return {
        success: true,
        data: flaggedCounts,
        message: 'Flagged entries count retrieved successfully'
      }
    } catch (error) {
      console.error('Error getting flagged entries count:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get flagged entries count'
      }
    }
  })

// Bulk flag multiple entries
export const bulkFlagEntries = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    entryIds: z.array(z.string().uuid()),
    priority: z.enum(['normal', 'important', 'flagged', 'needs_action', 'long_pending']),
    comment: z.string().optional()
  }))
  .handler(async ({ data }) => {
    try {
      // Update all entries with the specified priority
      const updatedEntries = await db.update(turnoverEntries)
        .set({
          priority: data.priority,
          updatedAt: new Date()
        })
        .where(sql`${turnoverEntries.id} IN (${data.entryIds.join(',')})`)
        .returning()

      return {
        success: true,
        data: {
          updatedCount: updatedEntries.length,
          entries: updatedEntries
        },
        message: `Successfully flagged ${updatedEntries.length} entries`
      }
    } catch (error) {
      console.error('Error bulk flagging entries:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to bulk flag entries'
      }
    }
  })

// Unflag an entry (set priority to normal)
export const unflagEntry = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    entryId: z.string().uuid()
  }))
  .handler(async ({ data }) => {
    try {
      // Update the entry priority to normal
      const [updatedEntry] = await db.update(turnoverEntries)
        .set({
          priority: 'normal',
          updatedAt: new Date()
        })
        .where(eq(turnoverEntries.id, data.entryId))
        .returning()

      if (!updatedEntry) {
        return {
          success: false,
          error: 'Entry not found',
          message: 'Failed to unflag entry'
        }
      }

      return {
        success: true,
        data: updatedEntry,
        message: 'Entry unflagged successfully'
      }
    } catch (error) {
      console.error('Error unflagging entry:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to unflag entry'
      }
    }
  })

// Get flagging history for an entry
export const getFlaggingHistory = createServerFn()
  .inputValidator(z.object({
    entryId: z.string().uuid()
  }))
  .handler(async ({ data }) => {
    try {
      // In a real implementation, we would have a separate table for flagging history
      // For now, we'll just return the current entry state
      const [entry] = await db.select()
        .from(turnoverEntries)
        .where(eq(turnoverEntries.id, data.entryId))
        .limit(1)

      if (!entry) {
        return {
          success: false,
          error: 'Entry not found',
          message: 'Failed to get flagging history'
        }
      }

      return {
        success: true,
        data: {
          entry,
          history: [
            {
              timestamp: entry.updatedAt,
              priority: entry.priority,
              comment: 'Current priority'
            }
          ]
        },
        message: 'Flagging history retrieved successfully'
      }
    } catch (error) {
      console.error('Error getting flagging history:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get flagging history'
      }
    }
  })

// Get flagging statistics for a team
export const getFlaggingStatistics = createServerFn()
  .inputValidator(z.object({
    teamId: z.string().uuid(),
    applicationId: z.string().uuid().optional(),
    subApplicationId: z.string().uuid().optional(),
    timeRange: z.enum(['7days', '30days', '90days']).default('30days')
  }))
  .handler(async ({ data }) => {
    try {
      // Calculate the date range
      const now = new Date()
      let startDate: Date

      switch (data.timeRange) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      // Get flagging statistics
      const flaggedCounts = await db.select({
        priority: turnoverEntries.priority,
        count: sql<number>`count(*)`.as('count')
      })
        .from(turnoverEntries)
        .where(and(
          sql`${turnoverEntries.priority} != 'normal'`,
          sql`${turnoverEntries.updatedAt} >= ${startDate}`
        ))
        .groupBy(turnoverEntries.priority)

      // Get total entries count
      const [totalEntries] = await db.select({ count: sql<number>`count(*)`.as('count') })
        .from(turnoverEntries)
        .where(sql`${turnoverEntries.updatedAt} >= ${startDate}`)

      // Calculate flagging trends (daily counts for the time range)
      const flaggingTrends = []
      const dayInMs = 24 * 60 * 60 * 1000
      const totalDays = Math.floor((now.getTime() - startDate.getTime()) / dayInMs)

      for (let i = 0; i < totalDays; i++) {
        const dayStart = new Date(startDate.getTime() + i * dayInMs)
        const dayEnd = new Date(startDate.getTime() + (i + 1) * dayInMs)

        const [dayCount] = await db.select({ count: sql<number>`count(*)`.as('count') })
          .from(turnoverEntries)
          .where(and(
            sql`${turnoverEntries.priority} != 'normal'`,
            sql`${turnoverEntries.updatedAt} >= ${dayStart}`,
            sql`${turnoverEntries.updatedAt} < ${dayEnd}`
          ))

        flaggingTrends.push({
          date: dayStart.toISOString().split('T')[0],
          count: dayCount?.count || 0
        })
      }

      return {
        success: true,
        data: {
          flaggedCounts,
          totalEntries: totalEntries?.count || 0,
          flaggingTrends,
          timeRange: data.timeRange
        },
        message: 'Flagging statistics retrieved successfully'
      }
    } catch (error) {
      console.error('Error getting flagging statistics:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get flagging statistics'
      }
    }
  })