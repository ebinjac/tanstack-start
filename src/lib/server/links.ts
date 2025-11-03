import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db'
import { 
  links, 
  linkCategories, 
  linkTags, 
  linkTagAssociations, 
  linkAccessLogs,
  teams,
  applications 
} from '@/db/schema'
import { eq, and, desc, asc, ilike, inArray, count, sql, or } from 'drizzle-orm'

// Zod schemas for validation
const CreateLinkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  originalUrl: z.string().url('Invalid URL format'),
  shortUrl: z.string().url('Invalid URL format').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  teamId: z.string().uuid('Invalid team ID'),
  applicationId: z.string().uuid('Invalid application ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  visibility: z.enum(['team', 'private']).default('team'),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  isPinned: z.boolean().default(false),
  tagIds: z.array(z.string().uuid()).default([]),
})

const UpdateLinkSchema = z.object({
  id: z.string().uuid('Invalid link ID'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  originalUrl: z.string().url('Invalid URL format').optional(),
  shortUrl: z.string().url('Invalid URL format').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  visibility: z.enum(['team', 'private']).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  isPinned: z.boolean().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
})

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  icon: z.string().max(50, 'Icon name too long').optional(),
  teamId: z.string().uuid('Invalid team ID'),
})

const CreateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  teamId: z.string().uuid('Invalid team ID'),
})

const GetLinksSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  visibility: z.enum(['team', 'private']).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  isPinned: z.boolean().optional(),
  search: z.string().optional(),
  applicationId: z.string().uuid('Invalid application ID').optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'clickCount', 'lastAccessedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateLinkInput = z.infer<typeof CreateLinkSchema>
export type UpdateLinkInput = z.infer<typeof UpdateLinkSchema>
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
export type CreateTagInput = z.infer<typeof CreateTagSchema>
export type GetLinksInput = z.infer<typeof GetLinksSchema>

// Link CRUD operations
export const serverCreateLink = createServerFn({ method: 'POST' })
  .inputValidator(CreateLinkSchema)
  .handler(async ({ data }) => {
    try {
      const result = await db.transaction(async (tx) => {
        // Create the link
        const [newLink] = await tx
          .insert(links)
          .values({
            title: data.title,
            originalUrl: data.originalUrl,
            shortUrl: data.shortUrl,
            description: data.description,
            teamId: data.teamId,
            applicationId: data.applicationId,
            categoryId: data.categoryId,
            visibility: data.visibility,
            status: data.status,
            isPinned: data.isPinned,
            createdBy: 'current-user', // TODO: Get from auth context
          })
          .returning()

        // Associate tags if provided
        if (data.tagIds && data.tagIds.length > 0) {
          await tx
            .insert(linkTagAssociations)
            .values(
              data.tagIds.map(tagId => ({
                linkId: newLink.id,
                tagId,
              }))
            )
        }

        return newLink
      })

      return {
        success: true,
        data: result,
        message: 'Link created successfully',
      }
    } catch (error) {
      console.error('Error creating link:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to create link')
    }
  })

export const serverUpdateLink = createServerFn({ method: 'POST' })
  .inputValidator(UpdateLinkSchema)
  .handler(async ({ data }) => {
    try {
      const result = await db.transaction(async (tx) => {
        // Update the link
        const updateData: any = {}
        if (data.title !== undefined) updateData.title = data.title
        if (data.originalUrl !== undefined) updateData.originalUrl = data.originalUrl
        if (data.shortUrl !== undefined) updateData.shortUrl = data.shortUrl
        if (data.description !== undefined) updateData.description = data.description
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
        if (data.visibility !== undefined) updateData.visibility = data.visibility
        if (data.status !== undefined) updateData.status = data.status
        if (data.isPinned !== undefined) updateData.isPinned = data.isPinned
        updateData.updatedBy = 'current-user' // TODO: Get from auth context
        updateData.updatedAt = new Date()

        const [updatedLink] = await tx
          .update(links)
          .set(updateData)
          .where(eq(links.id, data.id))
          .returning()

        if (!updatedLink) {
          throw new Error('Link not found')
        }

        // Update tag associations if provided
        if (data.tagIds !== undefined) {
          // Remove existing associations
          await tx
            .delete(linkTagAssociations)
            .where(eq(linkTagAssociations.linkId, data.id))

          // Add new associations
          if (data.tagIds.length > 0) {
            await tx
              .insert(linkTagAssociations)
              .values(
                data.tagIds.map(tagId => ({
                  linkId: data.id,
                  tagId,
                }))
              )
          }
        }

        return updatedLink
      })

      return {
        success: true,
        data: result,
        message: 'Link updated successfully',
      }
    } catch (error) {
      console.error('Error updating link:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to update link')
    }
  })

export const serverDeleteLink = createServerFn()
  .inputValidator(z.object({ id: z.string().uuid('Invalid link ID') }))
  .handler(async ({ data }) => {
    try {
      const [deletedLink] = await db
        .delete(links)
        .where(eq(links.id, data.id))
        .returning()

      if (!deletedLink) {
        throw new Error('Link not found')
      }

      return {
        success: true,
        data: deletedLink,
        message: 'Link deleted successfully',
      }
    } catch (error) {
      console.error('Error deleting link:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to delete link')
    }
  })

export const serverGetLink = createServerFn()
  .inputValidator(z.object({ id: z.string().uuid('Invalid link ID') }))
  .handler(async ({ data }) => {
    try {
      const [link] = await db
        .select({
          id: links.id,
          title: links.title,
          originalUrl: links.originalUrl,
          shortUrl: links.shortUrl,
          description: links.description,
          teamId: links.teamId,
          applicationId: links.applicationId,
          categoryId: links.categoryId,
          visibility: links.visibility,
          status: links.status,
          isPinned: links.isPinned,
          clickCount: links.clickCount,
          lastAccessedAt: links.lastAccessedAt,
          createdBy: links.createdBy,
          createdAt: links.createdAt,
          updatedBy: links.updatedBy,
          updatedAt: links.updatedAt,
        })
        .from(links)
        .where(eq(links.id, data.id))
        .limit(1)

      if (!link) {
        throw new Error('Link not found')
      }

      // Get associated tags
      const tagAssociations = await db
        .select({
          id: linkTags.id,
          name: linkTags.name,
          description: linkTags.description,
          color: linkTags.color,
        })
        .from(linkTagAssociations)
        .innerJoin(linkTags, eq(linkTagAssociations.tagId, linkTags.id))
        .where(eq(linkTagAssociations.linkId, data.id))

      return {
        success: true,
        data: {
          ...link,
          tags: tagAssociations,
        },
      }
    } catch (error) {
      console.error('Error fetching link:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch link')
    }
  })

export const serverGetLinks = createServerFn()
  .inputValidator(GetLinksSchema)
  .handler(async ({ data }) => {
    try {
      // For now, let's create a simpler query that works
      const results = await db
        .select()
        .from(links)
        .where(eq(links.teamId, data.teamId))
        .orderBy(desc(links.createdAt))
        .limit(data.limit)
        .offset(data.offset)

      return {
        success: true,
        data: results,
        message: 'Links retrieved successfully',
      }
    } catch (error) {
      console.error('Error fetching links:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch links')
    }
  })

// Simplified functions for getting links by different criteria
export const serverGetAllLinks = createServerFn()
  .inputValidator(z.object({ teamId: z.string().uuid('Invalid team ID') }))
  .handler(async ({ data }) => {
    try {
      const results = await db
        .select()
        .from(links)
        .where(eq(links.teamId, data.teamId))
        .orderBy(desc(links.createdAt))

      return {
        success: true,
        data: results,
      }
    } catch (error) {
      console.error('Error fetching all links:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch links')
    }
  })

export const serverGetPinnedLinks = createServerFn()
  .inputValidator(z.object({ teamId: z.string().uuid('Invalid team ID') }))
  .handler(async ({ data }) => {
    try {
      const results = await db
        .select()
        .from(links)
        .where(and(eq(links.teamId, data.teamId), eq(links.isPinned, true)))
        .orderBy(desc(links.createdAt))

      return {
        success: true,
        data: results,
      }
    } catch (error) {
      console.error('Error fetching pinned links:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch pinned links')
    }
  })

export const serverGetPublicLinks = createServerFn()
  .inputValidator(z.object({ teamId: z.string().uuid('Invalid team ID') }))
  .handler(async ({ data }) => {
    try {
      const results = await db
        .select()
        .from(links)
        .where(and(eq(links.teamId, data.teamId), eq(links.visibility, 'team')))
        .orderBy(desc(links.createdAt))

      return {
        success: true,
        data: results,
      }
    } catch (error) {
      console.error('Error fetching public links:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch public links')
    }
  })

export const serverGetPrivateLinks = createServerFn()
  .inputValidator(z.object({ teamId: z.string().uuid('Invalid team ID') }))
  .handler(async ({ data }) => {
    try {
      const results = await db
        .select()
        .from(links)
        .where(and(eq(links.teamId, data.teamId), eq(links.visibility, 'private')))
        .orderBy(desc(links.createdAt))

      return {
        success: true,
        data: results,
      }
    } catch (error) {
      console.error('Error fetching private links:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch private links')
    }
  })

export const serverGetLinksByCategory = createServerFn()
  .inputValidator(z.object({
    teamId: z.string().uuid('Invalid team ID'),
    categoryId: z.string().uuid('Invalid category ID')
  }))
  .handler(async ({ data }) => {
    try {
      const results = await db
        .select()
        .from(links)
        .where(and(eq(links.teamId, data.teamId), eq(links.categoryId, data.categoryId)))
        .orderBy(desc(links.createdAt))

      return {
        success: true,
        data: results,
      }
    } catch (error) {
      console.error('Error fetching links by category:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch links by category')
    }
  })

  export const serverGetLinksByApplication = createServerFn()
    .inputValidator(z.object({
      teamId: z.string().uuid('Invalid team ID'),
      applicationId: z.string().uuid('Invalid application ID')
    }))
    .handler(async ({ data }) => {
      try {
        const results = await db
          .select()
          .from(links)
          .where(and(eq(links.teamId, data.teamId), eq(links.applicationId, data.applicationId)))
          .orderBy(desc(links.createdAt))

        return {
          success: true,
          data: results,
        }
      } catch (error) {
        console.error('Error fetching links by application:', error)
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch links by application')
      }
    })

  // Category CRUD operations
export const serverCreateCategory = createServerFn({ method: 'POST' })
  .inputValidator(CreateCategorySchema)
  .handler(async ({ data }) => {
    try {
      const [newCategory] = await db
        .insert(linkCategories)
        .values({
          name: data.name,
          description: data.description,
          color: data.color,
          icon: data.icon,
          teamId: data.teamId,
          createdBy: 'current-user', // TODO: Get from auth context
        })
        .returning()

      return {
        success: true,
        data: newCategory,
        message: 'Category created successfully',
      }
    } catch (error) {
      console.error('Error creating category:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to create category')
    }
  })

export const serverGetCategories = createServerFn()
  .inputValidator(z.object({ teamId: z.string().uuid('Invalid team ID') }))
  .handler(async ({ data }) => {
    try {
      // Get categories with link counts
      const categories = await db
        .select({
          id: linkCategories.id,
          name: linkCategories.name,
          description: linkCategories.description,
          color: linkCategories.color,
          icon: linkCategories.icon,
          teamId: linkCategories.teamId,
          createdBy: linkCategories.createdBy,
          createdAt: linkCategories.createdAt,
          updatedBy: linkCategories.updatedBy,
          updatedAt: linkCategories.updatedAt,
          linkCount: count(links.id),
        })
        .from(linkCategories)
        .leftJoin(links, eq(linkCategories.id, links.categoryId))
        .where(eq(linkCategories.teamId, data.teamId))
        .groupBy(linkCategories.id)
        .orderBy(asc(linkCategories.name))

      return {
        success: true,
        data: categories,
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch categories')
    }
  })

export const serverUpdateCategory = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    id: z.string().uuid('Invalid category ID'),
    name: z.string().min(1, 'Category name is required').max(100, 'Name too long').optional(),
    description: z.string().max(500, 'Description too long').optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
    icon: z.string().max(50, 'Icon name too long').optional(),
  }))
  .handler(async ({ data }) => {
    try {
      const updateData: any = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.color !== undefined) updateData.color = data.color
      if (data.icon !== undefined) updateData.icon = data.icon
      updateData.updatedBy = 'current-user' // TODO: Get from auth context
      updateData.updatedAt = new Date()

      const [updatedCategory] = await db
        .update(linkCategories)
        .set(updateData)
        .where(eq(linkCategories.id, data.id))
        .returning()

      if (!updatedCategory) {
        throw new Error('Category not found')
      }

      return {
        success: true,
        data: updatedCategory,
        message: 'Category updated successfully',
      }
    } catch (error) {
      console.error('Error updating category:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to update category')
    }
  })

export const serverDeleteCategory = createServerFn()
  .inputValidator(z.object({
    id: z.string().uuid('Invalid category ID'),
    moveLinksToCategoryId: z.string().uuid('Invalid target category ID').optional(),
  }))
  .handler(async ({ data }) => {
    try {
      await db.transaction(async (tx) => {
        // If specified, move links to another category
        if (data.moveLinksToCategoryId) {
          await tx
            .update(links)
            .set({ categoryId: data.moveLinksToCategoryId })
            .where(eq(links.categoryId, data.id))
        } else {
          // Otherwise, remove category association from links
          await tx
            .update(links)
            .set({ categoryId: null })
            .where(eq(links.categoryId, data.id))
        }

        // Delete the category
        await tx
          .delete(linkCategories)
          .where(eq(linkCategories.id, data.id))
      })

      return {
        success: true,
        message: 'Category deleted successfully',
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to delete category')
    }
  })

  // Tag CRUD operations
export const serverCreateTag = createServerFn({ method: 'POST' })
  .inputValidator(CreateTagSchema)
  .handler(async ({ data }) => {
    try {
      const [newTag] = await db
        .insert(linkTags)
        .values({
          name: data.name,
          description: data.description,
          color: data.color,
          teamId: data.teamId,
          createdBy: 'current-user', // TODO: Get from auth context
        })
        .returning()

      return {
        success: true,
        data: newTag,
        message: 'Tag created successfully',
      }
    } catch (error) {
      console.error('Error creating tag:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to create tag')
    }
  })

export const serverGetTags = createServerFn()
  .inputValidator(z.object({ teamId: z.string().uuid('Invalid team ID') }))
  .handler(async ({ data }) => {
    try {
      const tags = await db
        .select()
        .from(linkTags)
        .where(eq(linkTags.teamId, data.teamId))
        .orderBy(asc(linkTags.name))

      return {
        success: true,
        data: tags,
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch tags')
    }
  })

// Link analytics
export const serverRecordLinkAccess = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ 
    linkId: z.string().uuid('Invalid link ID'),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    referer: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    try {
      await db.transaction(async (tx) => {
        // Record the access log
        await tx
          .insert(linkAccessLogs)
          .values({
            linkId: data.linkId,
            accessedBy: 'current-user', // TODO: Get from auth context
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            referer: data.referer,
          })

        // Update the link's click count and last accessed time
        await tx
          .update(links)
          .set({
            clickCount: sql`${links.clickCount} + 1`,
            lastAccessedAt: new Date(),
          })
          .where(eq(links.id, data.linkId))
      })

      return {
        success: true,
        message: 'Link access recorded successfully',
      }
    } catch (error) {
      console.error('Error recording link access:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to record link access')
    }
  })
  
  // Get applications for a team
  export const serverGetApplications = createServerFn()
    .inputValidator(z.object({ teamId: z.string().uuid('Invalid team ID') }))
    .handler(async ({ data }) => {
      try {
        const teamApplications = await db
          .select({
            id: applications.id,
            applicationName: applications.applicationName,
            tla: applications.tla,
            description: applications.description,
            status: applications.status,
          })
          .from(applications)
          .where(eq(applications.teamId, data.teamId))
          .orderBy(asc(applications.applicationName))
  
        return {
          success: true,
          data: teamApplications,
        }
      } catch (error) {
        console.error('Error fetching applications:', error)
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch applications')
      }
    })

// Get link statistics
export const serverGetLinkStats = createServerFn()
  .inputValidator(z.object({ teamId: z.string().uuid('Invalid team ID') }))
  .handler(async ({ data }) => {
    try {
      const [
        totalLinks,
        activeLinks,
        pinnedLinks,
        publicLinks,
        privateLinks,
        totalClicks,
      ] = await Promise.all([
        db.select({ count: count() }).from(links).where(eq(links.teamId, data.teamId)),
        db.select({ count: count() }).from(links).where(and(eq(links.teamId, data.teamId), eq(links.status, 'active'))),
        db.select({ count: count() }).from(links).where(and(eq(links.teamId, data.teamId), eq(links.isPinned, true))),
        db.select({ count: count() }).from(links).where(and(eq(links.teamId, data.teamId), eq(links.visibility, 'public'))),
        db.select({ count: count() }).from(links).where(and(eq(links.teamId, data.teamId), eq(links.visibility, 'private'))),
        db.select({ totalClicks: sql<number>`sum(click_count)` }).from(links).where(eq(links.teamId, data.teamId)),
      ])

      return {
        success: true,
        data: {
          totalLinks: Number(totalLinks[0]?.count || 0),
          activeLinks: Number(activeLinks[0]?.count || 0),
          pinnedLinks: Number(pinnedLinks[0]?.count || 0),
          publicLinks: Number(publicLinks[0]?.count || 0),
          privateLinks: Number(privateLinks[0]?.count || 0),
          totalClicks: Number(totalClicks[0]?.totalClicks || 0),
        },
      }
    } catch (error) {
      console.error('Error fetching link stats:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch link stats')
    }
  })

export const serverSearchLinks = createServerFn()
  .inputValidator(z.object({
    teamId: z.string().uuid('Invalid team ID'),
    search: z.string().optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    applicationId: z.string().uuid('Invalid application ID').optional(),
    visibility: z.enum(['team', 'private']).optional(),
    status: z.enum(['active', 'inactive', 'archived']).optional(),
    isPinned: z.boolean().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'clickCount', 'lastAccessedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  }))
  .handler(async ({ data }) => {
    try {
      // Apply filters
      const conditions = [eq(links.teamId, data.teamId)]
      
      if (data.search) {
        conditions.push(
          or(
            ilike(links.title, `%${data.search}%`),
            ilike(links.description, `%${data.search}%`),
            ilike(links.originalUrl, `%${data.search}%`)
          )!
        )
      }
      
      if (data.categoryId) {
        conditions.push(eq(links.categoryId, data.categoryId))
      }
      
      if (data.applicationId) {
        conditions.push(eq(links.applicationId, data.applicationId))
      }
      
      if (data.visibility) {
        conditions.push(eq(links.visibility, data.visibility))
      }
      
      if (data.status) {
        conditions.push(eq(links.status, data.status))
      }
      
      if (data.isPinned !== undefined) {
        conditions.push(eq(links.isPinned, data.isPinned))
      }

      // Apply sorting
      const orderByColumn = {
        createdAt: links.createdAt,
        updatedAt: links.updatedAt,
        title: links.title,
        clickCount: links.clickCount,
        lastAccessedAt: links.lastAccessedAt,
      }[data.sortBy]

      // Build the query
      const results = await db
        .select({
          id: links.id,
          title: links.title,
          originalUrl: links.originalUrl,
          shortUrl: links.shortUrl,
          description: links.description,
          teamId: links.teamId,
          applicationId: links.applicationId,
          categoryId: links.categoryId,
          visibility: links.visibility,
          status: links.status,
          isPinned: links.isPinned,
          clickCount: links.clickCount,
          lastAccessedAt: links.lastAccessedAt,
          createdBy: links.createdBy,
          createdAt: links.createdAt,
          updatedBy: links.updatedBy,
          updatedAt: links.updatedAt,
        })
        .from(links)
        .where(and(...conditions))
        .orderBy(
          data.sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn)
        )
        .limit(data.limit)
        .offset(data.offset)

      return {
        success: true,
        data: results,
      }
    } catch (error) {
      console.error('Error searching links:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to search links')
    }
  })

  // Bulk operations
  export const serverBulkUpdateLinks = createServerFn({ method: 'POST' })
    .inputValidator(z.object({
      linkIds: z.array(z.string().uuid('Invalid link ID')),
      updates: z.object({
        isPinned: z.boolean().optional(),
        visibility: z.enum(['team', 'private']).optional(),
        status: z.enum(['active', 'inactive', 'archived']).optional(),
        categoryId: z.string().uuid('Invalid category ID').optional(),
        applicationId: z.string().uuid('Invalid application ID').optional(),
      })
    }))
    .handler(async ({ data }) => {
      try {
        const result = await db.transaction(async (tx) => {
          const updateData: any = {}
          if (data.updates.isPinned !== undefined) updateData.isPinned = data.updates.isPinned
          if (data.updates.visibility !== undefined) updateData.visibility = data.updates.visibility
          if (data.updates.status !== undefined) updateData.status = data.updates.status
          if (data.updates.categoryId !== undefined) updateData.categoryId = data.updates.categoryId
          if (data.updates.applicationId !== undefined) updateData.applicationId = data.updates.applicationId
          updateData.updatedBy = 'current-user' // TODO: Get from auth context
          updateData.updatedAt = new Date()

          return await tx
            .update(links)
            .set(updateData)
            .where(inArray(links.id, data.linkIds))
            .returning()
        })

        return {
          success: true,
          data: result,
          message: `${result.length} links updated successfully`,
        }
      } catch (error) {
        console.error('Error updating links:', error)
        throw new Error(error instanceof Error ? error.message : 'Failed to update links')
      }
    })
  
    // Bulk tag operations
    export const serverBulkAddTags = createServerFn({ method: 'POST' })
      .inputValidator(z.object({
        linkIds: z.array(z.string().uuid('Invalid link ID')),
        tagIds: z.array(z.string().uuid('Invalid tag ID')),
      }))
      .handler(async ({ data }) => {
        try {
          const result = await db.transaction(async (tx) => {
            // Add tag associations for each link
            for (const linkId of data.linkIds) {
              for (const tagId of data.tagIds) {
                // Check if the association already exists
                const existing = await tx
                  .select()
                  .from(linkTagAssociations)
                  .where(and(
                    eq(linkTagAssociations.linkId, linkId),
                    eq(linkTagAssociations.tagId, tagId)
                  ))
                  .limit(1)
  
                // Only add if it doesn't already exist
                if (existing.length === 0) {
                  await tx
                    .insert(linkTagAssociations)
                    .values({
                      linkId,
                      tagId,
                    })
                }
              }
            }
  
            // Return the updated links
            return await tx
              .select()
              .from(links)
              .where(inArray(links.id, data.linkIds))
          })
  
          return {
            success: true,
            data: result,
            message: `Tags added to ${result.length} links successfully`,
          }
        } catch (error) {
          console.error('Error adding tags to links:', error)
          throw new Error(error instanceof Error ? error.message : 'Failed to add tags to links')
        }
      })
  
    export const serverBulkRemoveTags = createServerFn({ method: 'POST' })
      .inputValidator(z.object({
        linkIds: z.array(z.string().uuid('Invalid link ID')),
        tagIds: z.array(z.string().uuid('Invalid tag ID')),
      }))
      .handler(async ({ data }) => {
        try {
          const result = await db.transaction(async (tx) => {
            // Remove tag associations for each link
            await tx
              .delete(linkTagAssociations)
              .where(and(
                inArray(linkTagAssociations.linkId, data.linkIds),
                inArray(linkTagAssociations.tagId, data.tagIds)
              ))
  
            // Return the updated links
            return await tx
              .select()
              .from(links)
              .where(inArray(links.id, data.linkIds))
          })
  
          return {
            success: true,
            data: result,
            message: `Tags removed from ${result.length} links successfully`,
          }
        } catch (error) {
          console.error('Error removing tags from links:', error)
          throw new Error(error instanceof Error ? error.message : 'Failed to remove tags from links')
        }
      })
  
    // Bulk set category operation
    export const serverBulkSetCategory = createServerFn({ method: 'POST' })
      .inputValidator(z.object({
        linkIds: z.array(z.string().uuid('Invalid link ID')),
        categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
      }))
      .handler(async ({ data }) => {
        try {
          const result = await db.transaction(async (tx) => {
            // Update the category for all links
            return await tx
              .update(links)
              .set({
                categoryId: data.categoryId,
                updatedAt: new Date(),
                updatedBy: 'current-user' // TODO: Get from auth context
              })
              .where(inArray(links.id, data.linkIds))
              .returning()
          })
  
          return {
            success: true,
            data: result,
            message: `Category updated for ${result.length} links successfully`,
          }
        } catch (error) {
          console.error('Error setting category for links:', error)
          throw new Error(error instanceof Error ? error.message : 'Failed to set category for links')
        }
      })

  export const serverBulkDeleteLinks = createServerFn({ method: 'POST' })
    .inputValidator(z.object({
      linkIds: z.array(z.string().uuid('Invalid link ID')),
    }))
    .handler(async ({ data }) => {
      try {
        const result = await db
          .delete(links)
          .where(inArray(links.id, data.linkIds))
          .returning({ id: links.id })

        return {
          success: true,
          data: result,
          message: `${result.length} links deleted successfully`,
        }
      } catch (error) {
        console.error('Error deleting links:', error)
        throw new Error(error instanceof Error ? error.message : 'Failed to delete links')
      }
    })