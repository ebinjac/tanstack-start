import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db'
import {
  links,
  linkCategories,
  linkTags,
  linkTagAssociations
} from '@/db/schema'
import { eq, and, desc, asc, inArray } from 'drizzle-orm'

// Schema for importing a single link
const ImportLinkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  originalUrl: z.string().url('Please enter a valid URL'),
  description: z.string().max(1000, 'Description too long').optional(),
  categoryId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  visibility: z.enum(['team', 'private']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  tags: z.array(z.string()).optional(),
})

// Schema for the import request
const ImportLinksSchema = z.object({
  teamId: z.string().uuid(),
  links: z.array(ImportLinkSchema),
})

// Schema for the import result
const ImportResultSchema = z.object({
  total: z.number(),
  successful: z.number(),
  failed: z.number(),
  errors: z.array(z.object({
    link: ImportLinkSchema,
    error: z.string(),
  })),
})

type ImportLink = z.infer<typeof ImportLinkSchema>
type ImportLinks = z.infer<typeof ImportLinksSchema>
type ImportResult = z.infer<typeof ImportResultSchema>

// Server function to import links
export const serverImportLinks = createServerFn({ method: 'POST' })
  .inputValidator(ImportLinksSchema)
  .handler(async ({ data }) => {
    const { teamId, links: linksToImport } = data

    const result: ImportResult = {
      total: linksToImport.length,
      successful: 0,
      failed: 0,
      errors: [],
    }

    // Process each link
    for (const linkData of linksToImport) {
      try {
        // Check if URL already exists for this team
        const existingLink = await db
          .select()
          .from(links)
          .where(and(
            eq(links.teamId, teamId),
            eq(links.originalUrl, linkData.originalUrl)
          ))
          .limit(1)

        if (existingLink.length > 0) {
          result.failed++
          result.errors.push({
            link: linkData,
            error: 'Link with this URL already exists',
          })
          continue
        }

        // Create the link
        await db.insert(links).values({
          title: linkData.title,
          originalUrl: linkData.originalUrl,
          description: linkData.description || null,
          categoryId: linkData.categoryId || null,
          applicationId: linkData.applicationId || null,
          visibility: linkData.visibility || 'team',
          status: linkData.status || 'active',
          teamId,
          createdBy: 'current-user', // TODO: Get from auth context
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        result.successful++
      } catch (error) {
        result.failed++
        result.errors.push({
          link: linkData,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return {
      success: true,
      data: result,
    }
  })

// Server function to get import templates
export const serverGetImportTemplates = createServerFn()
  .handler(async () => {
    const templates = {
      json: [
        {
          title: 'Example Link',
          url: 'https://example.com',
          description: 'An example link',
          tags: ['example', 'demo']
        }
      ],
      csv: 'Title,URL,Description,Tags\nExample Link,https://example.com,An example link,example;demo',
      html: '<a href="https://example.com" title="An example link">Example Link</a>',
      markdown: '[Example Link](https://example.com)'
    }

    return {
      success: true,
      data: templates,
    }
  })