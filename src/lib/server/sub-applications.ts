// lib/server/sub-applications.ts

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db'
import { subApplications, applications } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// Zod schemas for validation
const CreateSubApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  subApplicationName: z.string().min(1).max(255),
  code: z.string().max(12).optional(),
  description: z.string().optional(),
})

const UpdateSubApplicationSchema = z.object({
  id: z.string().uuid(),
  subApplicationName: z.string().min(1).max(255).optional(),
  code: z.string().max(12).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
})

const GetSubApplicationsSchema = z.object({
  applicationId: z.union([
    z.string().uuid(),
    z.literal('all')
  ]),
})

// Get all sub-applications for an application
export const serverGetSubApplications = createServerFn()
  .inputValidator(GetSubApplicationsSchema)
  .handler(async ({ data }) => {
    try {
      // If applicationId is 'all', fetch all sub-applications for the team
      if (data.applicationId === 'all') {
        const result = await db
          .select({
            id: subApplications.id,
            subApplicationName: subApplications.subApplicationName,
            code: subApplications.code,
            description: subApplications.description,
            status: subApplications.status,
            createdAt: subApplications.createdAt,
            updatedAt: subApplications.updatedAt,
            applicationName: applications.applicationName,
            applicationId: subApplications.applicationId,
          })
          .from(subApplications)
          .leftJoin(applications, eq(subApplications.applicationId, applications.id))
          .orderBy(subApplications.subApplicationName)

        return {
          success: true,
          data: result
        }
      }
      // Otherwise, fetch sub-applications for a specific application
      else {
        const result = await db
          .select({
            id: subApplications.id,
            subApplicationName: subApplications.subApplicationName,
            code: subApplications.code,
            description: subApplications.description,
            status: subApplications.status,
            createdAt: subApplications.createdAt,
            updatedAt: subApplications.updatedAt,
            applicationName: applications.applicationName,
          })
          .from(subApplications)
          .leftJoin(applications, eq(subApplications.applicationId, applications.id))
          .where(eq(subApplications.applicationId, data.applicationId))
          .orderBy(subApplications.subApplicationName)

        return {
          success: true,
          data: result
        }
      }
    } catch (error) {
      console.error('Error fetching sub-applications:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch sub-applications'
      }
    }
  })

// Get a single sub-application by ID
export const serverGetSubApplication = createServerFn()
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    try {
      const result = await db
        .select({
          id: subApplications.id,
          subApplicationName: subApplications.subApplicationName,
          code: subApplications.code,
          description: subApplications.description,
          status: subApplications.status,
          createdAt: subApplications.createdAt,
          updatedAt: subApplications.updatedAt,
          applicationId: subApplications.applicationId,
          applicationName: applications.applicationName,
        })
        .from(subApplications)
        .leftJoin(applications, eq(subApplications.applicationId, applications.id))
        .where(eq(subApplications.id, data.id))
        .limit(1)

      return {
        success: true,
        data: result[0] || null
      }
    } catch (error) {
      console.error('Error fetching sub-application:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch sub-application'
      }
    }
  })

// Create a new sub-application
export const serverCreateSubApplication = createServerFn({ method: 'POST' })
  .inputValidator(CreateSubApplicationSchema)
  .handler(async ({ data }) => {
    try {
      // Check if application exists
      const application = await db
        .select()
        .from(applications)
        .where(eq(applications.id, data.applicationId))
        .limit(1)

      if (application.length === 0) {
        return {
          success: false,
          error: 'Application not found',
          message: 'Failed to create sub-application'
        }
      }

      // Check if sub-application name already exists for this application
      const existing = await db
        .select()
        .from(subApplications)
        .where(
          and(
            eq(subApplications.applicationId, data.applicationId),
            eq(subApplications.subApplicationName, data.subApplicationName)
          )
        )
        .limit(1)

      if (existing.length > 0) {
        return {
          success: false,
          error: 'Sub-application with this name already exists for this application',
          message: 'Failed to create sub-application'
        }
      }

      const result = await db
        .insert(subApplications)
        .values({
          applicationId: data.applicationId,
          subApplicationName: data.subApplicationName,
          code: data.code,
          description: data.description,
          createdBy: 'current-user', // TODO: Get from auth context
        })
        .returning()

      return {
        success: true,
        data: result[0],
        message: 'Sub-application created successfully'
      }
    } catch (error) {
      console.error('Error creating sub-application:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create sub-application'
      }
    }
  })

// Update an existing sub-application
export const serverUpdateSubApplication = createServerFn({ method: 'POST' })
  .inputValidator(UpdateSubApplicationSchema)
  .handler(async ({ data }) => {
    try {
      // Check if sub-application exists
      const existing = await db
        .select()
        .from(subApplications)
        .where(eq(subApplications.id, data.id))
        .limit(1)

      if (existing.length === 0) {
        return {
          success: false,
          error: 'Sub-application not found',
          message: 'Failed to update sub-application'
        }
      }

      // If updating name, check for duplicates
      if (data.subApplicationName && data.subApplicationName !== existing[0].subApplicationName) {
        const duplicate = await db
          .select()
          .from(subApplications)
          .where(
            and(
              eq(subApplications.applicationId, existing[0].applicationId),
              eq(subApplications.subApplicationName, data.subApplicationName)
            )
          )
          .limit(1)

        if (duplicate.length > 0) {
          return {
            success: false,
            error: 'Sub-application with this name already exists for this application',
            message: 'Failed to update sub-application'
          }
        }
      }

      const updateData: any = {
        updatedBy: 'current-user', // TODO: Get from auth context
        updatedAt: new Date(),
      }

      if (data.subApplicationName !== undefined) updateData.subApplicationName = data.subApplicationName
      if (data.code !== undefined) updateData.code = data.code
      if (data.description !== undefined) updateData.description = data.description
      if (data.status !== undefined) updateData.status = data.status

      const updateResult = await db
        .update(subApplications)
        .set(updateData)
        .where(eq(subApplications.id, data.id))
        .returning()

      return {
        success: true,
        data: updateResult[0],
        message: 'Sub-application updated successfully'
      }
    } catch (error) {
      console.error('Error updating sub-application:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update sub-application'
      }
    }
  })

// Delete a sub-application
export const serverDeleteSubApplication = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    try {
      const result = await db
        .delete(subApplications)
        .where(eq(subApplications.id, data.id))
        .returning()

      if (result.length === 0) {
        return {
          success: false,
          error: 'Sub-application not found',
          message: 'Failed to delete sub-application'
        }
      }

      return {
        success: true,
        data: result[0],
        message: 'Sub-application deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting sub-application:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to delete sub-application'
      }
    }
  })