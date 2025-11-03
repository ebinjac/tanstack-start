// lib/server/turnovers.ts

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db'
import { turnovers, turnoverEntries, turnoverSnapshots, applications, subApplications } from '@/db/schema'
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm'

// Zod schemas for validation
const CreateTurnoverSchema = z.object({
  teamId: z.string().uuid(),
  applicationId: z.string().uuid().optional(),
  subApplicationId: z.string().uuid().optional(),
  handoverFrom: z.string().min(1).max(255),
  handoverTo: z.string().min(1).max(255),
  turnoverDate: z.string().datetime().optional(),
})

const UpdateTurnoverSchema = z.object({
  id: z.string().uuid(),
  handoverFrom: z.string().min(1).max(255).optional(),
  handoverTo: z.string().min(1).max(255).optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
  turnoverDate: z.string().datetime().optional(),
})

const GetTurnoversSchema = z.object({
  teamId: z.string().uuid(),
  applicationId: z.string().uuid().optional(),
  subApplicationId: z.string().uuid().optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})

// Turnover entry schemas
const CreateTurnoverEntrySchema = z.object({
  turnoverId: z.string().uuid(),
  entryType: z.enum(['rfc', 'inc', 'alert', 'mim', 'email_slack', 'fyi']),
  priority: z.enum(['normal', 'important', 'flagged', 'needs_action', 'long_pending']).default('normal'),
  // RFC fields
  rfcNumber: z.string().max(100).optional(),
  rfcStatus: z.string().max(50).optional(),
  rfcValidatedBy: z.string().max(255).optional(),
  rfcDescription: z.string().optional(),
  // INC fields
  incNumber: z.string().max(100).optional(),
  incidentDescription: z.string().optional(),
  // Alert fields
  alertsIssues: z.string().optional(),
  // MIM fields
  mimLink: z.string().max(2048).optional(),
  mimSlackLink: z.string().max(2048).optional(),
  // Email/Slack fields
  emailSubjectSlackLink: z.string().max(2048).optional(),
  // FYI fields
  fyiInfo: z.string().optional(),
  // Common fields
  comments: z.string().optional(),
})

const UpdateTurnoverEntrySchema = z.object({
  id: z.string().uuid(),
  priority: z.enum(['normal', 'important', 'flagged', 'needs_action', 'long_pending']).optional(),
  // RFC fields
  rfcNumber: z.string().max(100).optional(),
  rfcStatus: z.string().max(50).optional(),
  rfcValidatedBy: z.string().max(255).optional(),
  rfcDescription: z.string().optional(),
  // INC fields
  incNumber: z.string().max(100).optional(),
  incidentDescription: z.string().optional(),
  // Alert fields
  alertsIssues: z.string().optional(),
  // MIM fields
  mimLink: z.string().max(2048).optional(),
  mimSlackLink: z.string().max(2048).optional(),
  // Email/Slack fields
  emailSubjectSlackLink: z.string().max(2048).optional(),
  // FYI fields
  fyiInfo: z.string().optional(),
  // Common fields
  comments: z.string().optional(),
})

// Get turnovers for a team
export const serverGetTurnovers = createServerFn()
  .inputValidator(GetTurnoversSchema)
  .handler(async ({ data }) => {
    try {
      // Build conditions array
      const conditions = [eq(turnovers.teamId, data.teamId)]
      
      if (data.applicationId) {
        conditions.push(eq(turnovers.applicationId, data.applicationId))
      }
      if (data.subApplicationId) {
        conditions.push(eq(turnovers.subApplicationId, data.subApplicationId))
      }
      if (data.status) {
        conditions.push(eq(turnovers.status, data.status))
      }

      let query = db
        .select({
          id: turnovers.id,
          teamId: turnovers.teamId,
          applicationId: turnovers.applicationId,
          subApplicationId: turnovers.subApplicationId,
          handoverFrom: turnovers.handoverFrom,
          handoverTo: turnovers.handoverTo,
          status: turnovers.status,
          turnoverDate: turnovers.turnoverDate,
          createdAt: turnovers.createdAt,
          updatedAt: turnovers.updatedAt,
          applicationName: applications.applicationName,
          subApplicationName: subApplications.subApplicationName,
        })
        .from(turnovers)
        .leftJoin(applications, eq(turnovers.applicationId, applications.id))
        .leftJoin(subApplications, eq(turnovers.subApplicationId, subApplications.id))
        .where(and(...conditions))
        .orderBy(desc(turnovers.turnoverDate))

      if (data.limit) {
        query = query.limit(data.limit)
      }
      if (data.offset) {
        query = query.offset(data.offset)
      }

      const result = await query

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Error fetching turnovers:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch turnovers'
      }
    }
  })

// Get a single turnover by ID with entries
export const serverGetTurnover = createServerFn()
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    try {
      // Get turnover details
      const turnoverResult = await db
        .select({
          id: turnovers.id,
          teamId: turnovers.teamId,
          applicationId: turnovers.applicationId,
          subApplicationId: turnovers.subApplicationId,
          handoverFrom: turnovers.handoverFrom,
          handoverTo: turnovers.handoverTo,
          status: turnovers.status,
          turnoverDate: turnovers.turnoverDate,
          createdAt: turnovers.createdAt,
          updatedAt: turnovers.updatedAt,
          applicationName: applications.applicationName,
          subApplicationName: subApplications.subApplicationName,
        })
        .from(turnovers)
        .leftJoin(applications, eq(turnovers.applicationId, applications.id))
        .leftJoin(subApplications, eq(turnovers.subApplicationId, subApplications.id))
        .where(eq(turnovers.id, data.id))
        .limit(1)

      if (turnoverResult.length === 0) {
        return {
          success: false,
          error: 'Turnover not found',
          message: 'Failed to fetch turnover'
        }
      }

      // Get turnover entries
      const entriesResult = await db
        .select()
        .from(turnoverEntries)
        .where(eq(turnoverEntries.turnoverId, data.id))
        .orderBy(turnoverEntries.createdAt)

      return {
        success: true,
        data: {
          ...turnoverResult[0],
          entries: entriesResult
        }
      }
    } catch (error) {
      console.error('Error fetching turnover:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch turnover'
      }
    }
  })

// Get latest turnover for a specific application/sub-application
export const serverGetLatestTurnover = createServerFn()
  .inputValidator(z.object({
    teamId: z.string().uuid(),
    applicationId: z.string().uuid().optional(),
    subApplicationId: z.string().uuid().optional(),
  }))
  .handler(async ({ data }) => {
    try {
      let query = db
        .select({
          id: turnovers.id,
          teamId: turnovers.teamId,
          applicationId: turnovers.applicationId,
          subApplicationId: turnovers.subApplicationId,
          handoverFrom: turnovers.handoverFrom,
          handoverTo: turnovers.handoverTo,
          status: turnovers.status,
          turnoverDate: turnovers.turnoverDate,
          createdAt: turnovers.createdAt,
          updatedAt: turnovers.updatedAt,
          applicationName: applications.applicationName,
          subApplicationName: subApplications.subApplicationName,
        })
        .from(turnovers)
        .leftJoin(applications, eq(turnovers.applicationId, applications.id))
        .leftJoin(subApplications, eq(turnovers.subApplicationId, subApplications.id))
        .where(eq(turnovers.teamId, data.teamId))

      if (data.applicationId) {
        query = query.where(eq(turnovers.applicationId, data.applicationId))
      }
      if (data.subApplicationId) {
        query = query.where(eq(turnovers.subApplicationId, data.subApplicationId))
      }

      const result = await query
        .orderBy(desc(turnovers.turnoverDate))
        .limit(1)

      if (result.length === 0) {
        return {
          success: true,
          data: null
        }
      }

      // Get entries for this turnover
      const entriesResult = await db
        .select()
        .from(turnoverEntries)
        .where(eq(turnoverEntries.turnoverId, result[0].id))
        .orderBy(turnoverEntries.createdAt)

      return {
        success: true,
        data: {
          ...result[0],
          entries: entriesResult
        }
      }
    } catch (error) {
      console.error('Error fetching latest turnover:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch latest turnover'
      }
    }
  })

// Create a new turnover
export const serverCreateTurnover = createServerFn({ method: 'POST' })
  .inputValidator(CreateTurnoverSchema)
  .handler(async ({ data }) => {
    try {
      const result = await db
        .insert(turnovers)
        .values({
          teamId: data.teamId,
          applicationId: data.applicationId,
          subApplicationId: data.subApplicationId,
          handoverFrom: data.handoverFrom,
          handoverTo: data.handoverTo,
          turnoverDate: data.turnoverDate ? new Date(data.turnoverDate) : new Date(),
          createdBy: 'current-user', // TODO: Get from auth context
          updatedBy: 'current-user',
        })
        .returning()

      return {
        success: true,
        data: result[0],
        message: 'Turnover created successfully'
      }
    } catch (error) {
      console.error('Error creating turnover:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create turnover'
      }
    }
  })

// Update an existing turnover
export const serverUpdateTurnover = createServerFn({ method: 'POST' })
  .inputValidator(UpdateTurnoverSchema)
  .handler(async ({ data }) => {
    try {
      const updateData: any = {
        updatedBy: 'current-user',
        updatedAt: new Date(),
      }

      if (data.handoverFrom !== undefined) updateData.handoverFrom = data.handoverFrom
      if (data.handoverTo !== undefined) updateData.handoverTo = data.handoverTo
      if (data.status !== undefined) updateData.status = data.status
      if (data.turnoverDate !== undefined) updateData.turnoverDate = new Date(data.turnoverDate)

      const result = await db
        .update(turnovers)
        .set(updateData)
        .where(eq(turnovers.id, data.id))
        .returning()

      if (result.length === 0) {
        return {
          success: false,
          error: 'Turnover not found',
          message: 'Failed to update turnover'
        }
      }

      return {
        success: true,
        data: result[0],
        message: 'Turnover updated successfully'
      }
    } catch (error) {
      console.error('Error updating turnover:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update turnover'
      }
    }
  })

// Create a turnover entry
export const serverCreateTurnoverEntry = createServerFn({ method: 'POST' })
  .inputValidator(CreateTurnoverEntrySchema)
  .handler(async ({ data }) => {
    try {
      const result = await db
        .insert(turnoverEntries)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      return {
        success: true,
        data: result[0],
        message: 'Turnover entry created successfully'
      }
    } catch (error) {
      console.error('Error creating turnover entry:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create turnover entry'
      }
    }
  })

// Update a turnover entry
export const serverUpdateTurnoverEntry = createServerFn({ method: 'POST' })
  .inputValidator(UpdateTurnoverEntrySchema)
  .handler(async ({ data }) => {
    try {
      const updateData: any = {
        updatedAt: new Date(),
      }

      // Only include fields that are provided
      if (data.priority !== undefined) updateData.priority = data.priority
      if (data.rfcNumber !== undefined) updateData.rfcNumber = data.rfcNumber
      if (data.rfcStatus !== undefined) updateData.rfcStatus = data.rfcStatus
      if (data.rfcValidatedBy !== undefined) updateData.rfcValidatedBy = data.rfcValidatedBy
      if (data.rfcDescription !== undefined) updateData.rfcDescription = data.rfcDescription
      if (data.incNumber !== undefined) updateData.incNumber = data.incNumber
      if (data.incidentDescription !== undefined) updateData.incidentDescription = data.incidentDescription
      if (data.alertsIssues !== undefined) updateData.alertsIssues = data.alertsIssues
      if (data.mimLink !== undefined) updateData.mimLink = data.mimLink
      if (data.mimSlackLink !== undefined) updateData.mimSlackLink = data.mimSlackLink
      if (data.emailSubjectSlackLink !== undefined) updateData.emailSubjectSlackLink = data.emailSubjectSlackLink
      if (data.fyiInfo !== undefined) updateData.fyiInfo = data.fyiInfo
      if (data.comments !== undefined) updateData.comments = data.comments

      const result = await db
        .update(turnoverEntries)
        .set(updateData)
        .where(eq(turnoverEntries.id, data.id))
        .returning()

      if (result.length === 0) {
        return {
          success: false,
          error: 'Turnover entry not found',
          message: 'Failed to update turnover entry'
        }
      }

      return {
        success: true,
        data: result[0],
        message: 'Turnover entry updated successfully'
      }
    } catch (error) {
      console.error('Error updating turnover entry:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update turnover entry'
      }
    }
  })

// Delete a turnover entry
export const serverDeleteTurnoverEntry = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    try {
      const result = await db
        .delete(turnoverEntries)
        .where(eq(turnoverEntries.id, data.id))
        .returning()

      if (result.length === 0) {
        return {
          success: false,
          error: 'Turnover entry not found',
          message: 'Failed to delete turnover entry'
        }
      }

      return {
        success: true,
        data: result[0],
        message: 'Turnover entry deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting turnover entry:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to delete turnover entry'
      }
    }
  })

// Get stale entries (older than 24 hours)
export const serverGetStaleEntries = createServerFn()
  .inputValidator(z.object({
    teamId: z.string().uuid(),
    hours: z.number().default(24),
  }))
  .handler(async ({ data }) => {
    try {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - data.hours)

      const result = await db
        .select({
          id: turnoverEntries.id,
          turnoverId: turnoverEntries.turnoverId,
          entryType: turnoverEntries.entryType,
          priority: turnoverEntries.priority,
          updatedAt: turnoverEntries.updatedAt,
          handoverFrom: turnovers.handoverFrom,
          handoverTo: turnovers.handoverTo,
          applicationName: applications.applicationName,
          subApplicationName: subApplications.subApplicationName,
        })
        .from(turnoverEntries)
        .innerJoin(turnovers, eq(turnoverEntries.turnoverId, turnovers.id))
        .leftJoin(applications, eq(turnovers.applicationId, applications.id))
        .leftJoin(subApplications, eq(turnovers.subApplicationId, subApplications.id))
        .where(
          and(
            eq(turnovers.teamId, data.teamId),
            lte(turnoverEntries.updatedAt, cutoffTime)
          )
        )
        .orderBy(turnoverEntries.updatedAt)

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Error fetching stale entries:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch stale entries'
      }
    }
  })

// Create daily snapshot
export const serverCreateDailySnapshot = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    teamId: z.string().uuid(),
    applicationId: z.string().uuid().optional(),
    subApplicationId: z.string().uuid().optional(),
    snapshotDate: z.string().datetime(),
  }))
  .handler(async ({ data }) => {
    try {
      const snapshotDate = new Date(data.snapshotDate)
      
      // Build conditions array
      const conditions = [eq(turnovers.teamId, data.teamId)]
      
      if (data.applicationId) {
        conditions.push(eq(turnovers.applicationId, data.applicationId))
      }
      if (data.subApplicationId) {
        conditions.push(eq(turnovers.subApplicationId, data.subApplicationId))
      }

      // Get current turnover data
      const turnoverData = await db
        .select({
          id: turnovers.id,
          teamId: turnovers.teamId,
          applicationId: turnovers.applicationId,
          subApplicationId: turnovers.subApplicationId,
          handoverFrom: turnovers.handoverFrom,
          handoverTo: turnovers.handoverTo,
          status: turnovers.status,
          turnoverDate: turnovers.turnoverDate,
          createdAt: turnovers.createdAt,
          updatedAt: turnovers.updatedAt,
        })
        .from(turnovers)
        .where(and(...conditions))

      // Get entries for these turnovers
      const turnoverIds = turnoverData.map(t => t.id)
      const entriesData = turnoverIds.length > 0 
        ? await db
            .select()
            .from(turnoverEntries)
            .where(sql`${turnoverEntries.turnoverId} = ANY(${turnoverIds})`)
        : []

      // Combine data
      const completeData = turnoverData.map(turnover => ({
        ...turnover,
        entries: entriesData.filter(entry => entry.turnoverId === turnover.id)
      }))

      // Create snapshot
      const result = await db
        .insert(turnoverSnapshots)
        .values({
          teamId: data.teamId,
          applicationId: data.applicationId,
          subApplicationId: data.subApplicationId,
          snapshotDate,
          turnoverData: completeData as any,
        })
        .returning()

      return {
        success: true,
        data: result[0],
        message: 'Daily snapshot created successfully'
      }
    } catch (error) {
      console.error('Error creating daily snapshot:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create daily snapshot'
      }
    }
  })

// Get historical snapshots
export const serverGetSnapshots = createServerFn()
  .inputValidator(z.object({
    teamId: z.string().uuid(),
    applicationId: z.string().uuid().optional(),
    subApplicationId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }))
  .handler(async ({ data }) => {
    try {
      // Build conditions array
      const conditions = [eq(turnoverSnapshots.teamId, data.teamId)]
      
      if (data.applicationId) {
        conditions.push(eq(turnoverSnapshots.applicationId, data.applicationId))
      }
      if (data.subApplicationId) {
        conditions.push(eq(turnoverSnapshots.subApplicationId, data.subApplicationId))
      }
      if (data.startDate) {
        conditions.push(gte(turnoverSnapshots.snapshotDate, new Date(data.startDate)))
      }
      if (data.endDate) {
        conditions.push(lte(turnoverSnapshots.snapshotDate, new Date(data.endDate)))
      }

      const result = await db
        .select()
        .from(turnoverSnapshots)
        .where(and(...conditions))
        .orderBy(desc(turnoverSnapshots.snapshotDate))

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch snapshots'
      }
    }
  })