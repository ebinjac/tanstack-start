// lib/server/persistence.ts

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db'
import { turnovers, turnoverEntries, turnoverDrafts } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

// Zod schemas for validation
const SaveTurnoverDraftSchema = z.object({
  teamId: z.string().uuid(),
  applicationId: z.string().uuid().optional(),
  subApplicationId: z.string().uuid().optional(),
  handoverFrom: z.string().min(1),
  handoverTo: z.string().min(1),
  status: z.enum(['draft', 'active', 'completed', 'archived']).default('draft'),
  entries: z.array(z.any()).default([]),
})

const GetTurnoverDraftSchema = z.object({
  teamId: z.string().uuid(),
  applicationId: z.string().uuid().optional(),
  subApplicationId: z.string().uuid().optional(),
})

const DeleteTurnoverDraftSchema = z.object({
  draftId: z.string().uuid(),
})

// Save turnover draft
export const saveTurnoverDraft = createServerFn({ method: 'POST' })
  .inputValidator(SaveTurnoverDraftSchema)
  .handler(async ({ data }) => {
    try {
      // Check if a draft already exists for this combination
      const existingDraft = await db.select()
        .from(turnoverDrafts)
        .where(and(
          eq(turnoverDrafts.teamId, data.teamId),
          data.applicationId ? eq(turnoverDrafts.applicationId, data.applicationId) : sql`true`,
          data.subApplicationId ? eq(turnoverDrafts.subApplicationId, data.subApplicationId) : sql`true`,
          eq(turnoverDrafts.status, 'draft')
        ))
        .limit(1)

      let draftId
      let isNewDraft = false

      if (existingDraft.length > 0) {
        // Update existing draft
        draftId = existingDraft[0].id
        await db.update(turnoverDrafts)
          .set({
            handoverFrom: data.handoverFrom,
            handoverTo: data.handoverTo,
            status: data.status,
            entries: data.entries,
            updatedAt: new Date()
          })
          .where(eq(turnoverDrafts.id, draftId))
      } else {
        // Create new draft
        const [newDraft] = await db.insert(turnoverDrafts)
          .values({
            teamId: data.teamId,
            applicationId: data.applicationId,
            subApplicationId: data.subApplicationId,
            handoverFrom: data.handoverFrom,
            handoverTo: data.handoverTo,
            status: data.status,
            entries: data.entries,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
        
        draftId = newDraft.id
        isNewDraft = true
      }

      return {
        success: true,
        data: {
          draftId,
          isNewDraft,
          message: isNewDraft ? 'Draft created successfully' : 'Draft updated successfully'
        }
      }
    } catch (error) {
      console.error('Error saving turnover draft:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to save draft'
      }
    }
  })

// Get turnover draft
export const getTurnoverDraft = createServerFn()
  .inputValidator(GetTurnoverDraftSchema)
  .handler(async ({ data }) => {
    try {
      const [draft] = await db.select()
        .from(turnoverDrafts)
        .where(and(
          eq(turnoverDrafts.teamId, data.teamId),
          data.applicationId ? eq(turnoverDrafts.applicationId, data.applicationId) : sql`true`,
          data.subApplicationId ? eq(turnoverDrafts.subApplicationId, data.subApplicationId) : sql`true`,
          eq(turnoverDrafts.status, 'draft')
        ))
        .limit(1)

      if (!draft) {
        return {
          success: true,
          data: null,
          message: 'No draft found'
        }
      }

      return {
        success: true,
        data: draft,
        message: 'Draft retrieved successfully'
      }
    } catch (error) {
      console.error('Error getting turnover draft:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get draft'
      }
    }
  })

// Get all drafts for a team
export const getTeamDrafts = createServerFn()
  .inputValidator(z.string().uuid())
  .handler(async ({ data: teamId }) => {
    try {
      const drafts = await db.select()
        .from(turnoverDrafts)
        .where(eq(turnoverDrafts.teamId, teamId))
        .orderBy(desc(turnoverDrafts.updatedAt))

      return {
        success: true,
        data: drafts,
        message: 'Drafts retrieved successfully'
      }
    } catch (error) {
      console.error('Error getting team drafts:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get drafts'
      }
    }
  })

// Delete turnover draft
export const deleteTurnoverDraft = createServerFn({ method: 'POST' })
  .inputValidator(DeleteTurnoverDraftSchema)
  .handler(async ({ data }) => {
    try {
      const [deletedDraft] = await db.delete(turnoverDrafts)
        .where(eq(turnoverDrafts.id, data.draftId))
        .returning()

      if (!deletedDraft) {
        return {
          success: false,
          error: 'Draft not found',
          message: 'Failed to delete draft'
        }
      }

      return {
        success: true,
        data: deletedDraft,
        message: 'Draft deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting turnover draft:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to delete draft'
      }
    }
  })

// Auto-save turnover draft (called periodically)
export const autoSaveTurnoverDraft = createServerFn({ method: 'POST' })
  .inputValidator(SaveTurnoverDraftSchema)
  .handler(async ({ data }) => {
    try {
      // This is similar to saveTurnoverDraft but with auto-save specific logic
      const result = await saveTurnoverDraft({ data })
      
      return {
        ...result,
        message: result.success ? 'Auto-saved successfully' : result.message
      }
    } catch (error) {
      console.error('Error auto-saving turnover draft:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to auto-save draft'
      }
    }
  })

// Prefill turnover data from previous turnover
export const getPrefillData = createServerFn()
  .inputValidator(z.object({
    teamId: z.string().uuid(),
    applicationId: z.string().uuid().optional(),
    subApplicationId: z.string().uuid().optional(),
    handoverFrom: z.string().optional(),
    handoverTo: z.string().optional()
  }))
  .handler(async ({ data }) => {
    try {
      // First, check if there's a draft
      const draftResult = await getTurnoverDraft({
        data: {
          teamId: data.teamId,
          applicationId: data.applicationId,
          subApplicationId: data.subApplicationId
        }
      })

      if (draftResult.success && draftResult.data) {
        return {
          success: true,
          data: {
            source: 'draft',
            turnoverData: draftResult.data,
            message: 'Prefilled from draft'
          }
        }
      }

      // If no draft, try to get the most recent completed turnover with the same application/sub-application
      const [lastTurnover] = await db.select()
        .from(turnovers)
        .where(and(
          eq(turnovers.teamId, data.teamId),
          data.applicationId ? eq(turnovers.applicationId, data.applicationId) : sql`true`,
          data.subApplicationId ? eq(turnovers.subApplicationId, data.subApplicationId) : sql`true`,
          eq(turnovers.status, 'completed')
        ))
        .orderBy(desc(turnovers.updatedAt))
        .limit(1)

      if (lastTurnover) {
        // Get entries for the last turnover
        const entries = await db.select()
          .from(turnoverEntries)
          .where(eq(turnoverEntries.turnoverId, lastTurnover.id))

        return {
          success: true,
          data: {
            source: 'previous',
            turnoverData: {
              ...lastTurnover,
              entries
            },
            message: 'Prefilled from previous turnover'
          }
        }
      }

      // If no draft or previous turnover, return default prefilled data
      return {
        success: true,
        data: {
          source: 'default',
          turnoverData: {
            handoverFrom: data.handoverFrom || '',
            handoverTo: data.handoverTo || '',
            entries: []
          },
          message: 'Using default prefilled data'
        }
      }
    } catch (error) {
      console.error('Error getting prefilled data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get prefilled data'
      }
    }
  })

// Get turnover history for prefill suggestions
export const getTurnoverHistoryForPrefill = createServerFn()
  .inputValidator(z.object({
    teamId: z.string().uuid(),
    applicationId: z.string().uuid().optional(),
    subApplicationId: z.string().uuid().optional(),
    limit: z.number().default(5)
  }))
  .handler(async ({ data }) => {
    try {
      const completedTurnovers = await db.select({
        id: turnovers.id,
        handoverFrom: turnovers.handoverFrom,
        handoverTo: turnovers.handoverTo,
        completedAt: turnovers.updatedAt,
        applicationId: turnovers.applicationId,
        subApplicationId: turnovers.subApplicationId
      })
        .from(turnovers)
        .where(and(
          eq(turnovers.teamId, data.teamId),
          data.applicationId ? eq(turnovers.applicationId, data.applicationId) : sql`true`,
          data.subApplicationId ? eq(turnovers.subApplicationId, data.subApplicationId) : sql`true`,
          eq(turnovers.status, 'completed')
        ))
        .orderBy(desc(turnovers.updatedAt))
        .limit(data.limit)

      // Get entry counts for each turnover
      const turnoverIds = completedTurnovers.map(t => t.id)
      const entryCounts = turnoverIds.length > 0 ? await db.select({
          turnoverId: turnoverEntries.turnoverId,
          entryType: turnoverEntries.entryType,
          count: sql<number>`count(*)`.as('count')
        })
        .from(turnoverEntries)
        .where(sql`${turnoverEntries.turnoverId} IN (${turnoverIds.join(',')})`)
        .groupBy(turnoverEntries.turnoverId, turnoverEntries.entryType) : []

      // Combine turnover data with entry counts
      const enrichedTurnovers = completedTurnovers.map(turnover => {
        const counts = entryCounts.filter(count => count.turnoverId === turnover.id)
        const entriesByType = counts.reduce((acc, count) => {
          acc[count.entryType] = count.count
          return acc
        }, {} as Record<string, number>)

        return {
          ...turnover,
          entryCounts: entriesByType,
          totalEntries: Object.values(entriesByType).reduce((sum, count) => sum + count, 0)
        }
      })

      return {
        success: true,
        data: enrichedTurnovers,
        message: 'Turnover history retrieved successfully'
      }
    } catch (error) {
      console.error('Error getting turnover history for prefill:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get turnover history'
      }
    }
  })