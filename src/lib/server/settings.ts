import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/db'
import {
  toolSettingsSchema,
  globalToolSettings,
  teamToolSettings,
  settingsActivityLog,
  DEFAULT_TOOL_CONFIGURATIONS,
  type ToolSettingsSchema as ToolSettingsSchemaType,
} from '@/db/schema/settings'

// Validation schemas
const GetToolSettingsSchema = z.object({
  teamId: z.string().uuid().optional(),
  toolKey: z.string(),
})

const UpdateToolSettingsSchema = z.object({
  teamId: z.string().uuid().optional(),
  toolKey: z.string(),
  settings: z.record(z.any()),
})

const CreateToolSchemaSchema = z.object({
  toolKey: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().max(50).default('tool'),
  settingsTemplate: z.record(z.any()),
  validationSchema: z.record(z.any()).optional(),
  isTeamConfigurable: z.boolean().default(true),
  isAdminConfigurable: z.boolean().default(true),
})

const GetActivityLogSchema = z.object({
  teamId: z.string().uuid().optional(),
  toolKey: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

// Get tool settings (with fallback to global defaults)
export const serverGetToolSettings = createServerFn()
  .validator(GetToolSettingsSchema)
  .handler(async ({ data }) => {
    const { teamId, toolKey } = data

    try {
      // Get tool schema first
      const toolSchema = await db
        .select()
        .from(toolSettingsSchema)
        .where(eq(toolSettingsSchema.toolKey, toolKey))
        .limit(1)

      if (!toolSchema.length) {
        throw new Error(`Tool schema not found for: ${toolKey}`)
      }

      let settings = toolSchema[0].settingsTemplate

      // If team-specific settings requested
      if (teamId) {
        const teamSettings = await db
          .select()
          .from(teamToolSettings)
          .where(
            and(
              eq(teamToolSettings.teamId, teamId),
              eq(teamToolSettings.toolKey, toolKey),
              eq(teamToolSettings.isActive, true)
            )
          )
          .limit(1)

        if (teamSettings.length) {
          // Merge team settings with template (team overrides take precedence)
          settings = { ...settings, ...teamSettings[0].settings }
        }
      } else {
        // Get global settings
        const globalSettings = await db
          .select()
          .from(globalToolSettings)
          .where(eq(globalToolSettings.toolKey, toolKey))
          .limit(1)

        if (globalSettings.length) {
          // Merge global settings with template
          settings = { ...settings, ...globalSettings[0].settings }
        }
      }

      return {
        success: true,
        data: {
          toolKey,
          schema: toolSchema[0],
          settings,
          isGlobal: !teamId,
        },
      }
    } catch (error) {
      console.error('Error getting tool settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tool settings',
      }
    }
  })

// Update tool settings
export const serverUpdateToolSettings = createServerFn({ method: 'POST' })
  .validator(UpdateToolSettingsSchema)
  .handler(async ({ data }) => {
    const { teamId, toolKey, settings } = data
    const userId = 'current-user-id' // TODO: Get from auth context

    try {
      // Validate tool schema exists
      const toolSchema = await db
        .select()
        .from(toolSettingsSchema)
        .where(eq(toolSettingsSchema.toolKey, toolKey))
        .limit(1)

      if (!toolSchema.length) {
        throw new Error(`Tool schema not found for: ${toolKey}`)
      }

      const schema = toolSchema[0]
      let previousValue: any = null

      if (teamId) {
        // Update team-specific settings
        if (!schema.isTeamConfigurable) {
          throw new Error(`Tool ${toolKey} is not configurable at team level`)
        }

        // Get existing settings for activity log
        const existing = await db
          .select()
          .from(teamToolSettings)
          .where(
            and(
              eq(teamToolSettings.teamId, teamId),
              eq(teamToolSettings.toolKey, toolKey)
            )
          )
          .limit(1)

        previousValue = existing.length ? existing[0].settings : null

        // Upsert team settings
        await db
          .insert(teamToolSettings)
          .values({
            teamId,
            toolKey,
            settings,
            isActive: true,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [teamToolSettings.teamId, teamToolSettings.toolKey],
            set: {
              settings,
              isActive: true,
              updatedBy: userId,
              updatedAt: new Date(),
            },
          })
      } else {
        // Update global settings
        if (!schema.isAdminConfigurable) {
          throw new Error(`Tool ${toolKey} is not configurable at global level`)
        }

        // Get existing global settings for activity log
        const existing = await db
          .select()
          .from(globalToolSettings)
          .where(eq(globalToolSettings.toolKey, toolKey))
          .limit(1)

        previousValue = existing.length ? existing[0].settings : null

        // Upsert global settings
        await db
          .insert(globalToolSettings)
          .values({
            toolKey,
            settings,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: globalToolSettings.toolKey,
            set: {
              settings,
              updatedBy: userId,
              updatedAt: new Date(),
            },
          })
      }

      // Log activity
      await db.insert(settingsActivityLog).values({
        teamId: teamId || null,
        toolKey,
        action: 'updated',
        previousValue,
        newValue: settings,
        userId,
        scope: teamId ? 'team' : 'global',
        metadata: {
          toolName: schema.name,
        },
      })

      return {
        success: true,
        data: {
          toolKey,
          settings,
          isGlobal: !teamId,
        },
      }
    } catch (error) {
      console.error('Error updating tool settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tool settings',
      }
    }
  })

// Get all tool schemas
export const serverGetToolSchemas = createServerFn().handler(async () => {
  try {
    const schemas = await db.select().from(toolSettingsSchema).orderBy(toolSettingsSchema.category, toolSettingsSchema.name)

    return {
      success: true,
      data: schemas,
    }
  } catch (error) {
    console.error('Error getting tool schemas:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tool schemas',
    }
  }
})

// Create new tool schema
export const serverCreateToolSchema = createServerFn({ method: 'POST' })
  .validator(CreateToolSchemaSchema)
  .handler(async ({ data }) => {
    const userId = 'admin-user-id' // TODO: Get from auth context

    try {
      await db.insert(toolSettingsSchema).values({
        ...data,
        updatedAt: new Date(),
      })

      // Log activity
      await db.insert(settingsActivityLog).values({
        toolKey: data.toolKey,
        action: 'created',
        newValue: data,
        userId,
        scope: 'global',
        metadata: {
          toolName: data.name,
        },
      })

      return {
        success: true,
        data: {
          toolKey: data.toolKey,
          name: data.name,
        },
      }
    } catch (error) {
      console.error('Error creating tool schema:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tool schema',
      }
    }
  })

// Initialize default tool configurations
export const serverInitializeDefaultTools = createServerFn().handler(async () => {
  try {
    const results = []

    for (const [toolKey, config] of Object.entries(DEFAULT_TOOL_CONFIGURATIONS)) {
      // Check if schema already exists
      const existing = await db
        .select()
        .from(toolSettingsSchema)
        .where(eq(toolSettingsSchema.toolKey, toolKey))
        .limit(1)

      if (!existing.length) {
        // Create new schema
        await db.insert(toolSettingsSchema).values({
          toolKey,
          name: config.name,
          description: config.description,
          category: config.category,
          settingsTemplate: config.settingsTemplate,
          validationSchema: config.validationSchema,
          isTeamConfigurable: true,
          isAdminConfigurable: true,
          updatedAt: new Date(),
        })

        // Create global default settings
        await db.insert(globalToolSettings).values({
          toolKey,
          settings: config.settingsTemplate,
          updatedBy: 'system',
          updatedAt: new Date(),
        })

        results.push({ toolKey, status: 'created' })
      } else {
        results.push({ toolKey, status: 'exists' })
      }
    }

    return {
      success: true,
      data: results,
    }
  } catch (error) {
    console.error('Error initializing default tools:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize default tools',
    }
  }
})

// Get settings activity log
export const serverGetSettingsActivityLog = createServerFn()
  .validator(GetActivityLogSchema)
  .handler(async ({ data }) => {
    const { teamId, toolKey, limit, offset } = data

    try {
      let query = db
        .select()
        .from(settingsActivityLog)
        .orderBy(desc(settingsActivityLog.createdAt))
        .limit(limit)
        .offset(offset)

      // Apply filters
      if (teamId) {
        query = query.where(eq(settingsActivityLog.teamId, teamId))
      }
      if (toolKey) {
        query = query.where(eq(settingsActivityLog.toolKey, toolKey))
      }

      const logs = await query

      return {
        success: true,
        data: logs,
      }
    } catch (error) {
      console.error('Error getting activity log:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get activity log',
      }
    }
  })

// Reset tool settings to defaults
export const serverResetToolSettings = createServerFn()
  .validator(GetToolSettingsSchema)
  .handler(async ({ data }) => {
    const { teamId, toolKey } = data
    const userId = 'current-user-id' // TODO: Get from auth context

    try {
      const toolSchema = await db
        .select()
        .from(toolSettingsSchema)
        .where(eq(toolSettingsSchema.toolKey, toolKey))
        .limit(1)

      if (!toolSchema.length) {
        throw new Error(`Tool schema not found for: ${toolKey}`)
      }

      const defaultSettings = toolSchema[0].settingsTemplate
      let previousValue: any = null

      if (teamId) {
        // Get existing team settings
        const existing = await db
          .select()
          .from(teamToolSettings)
          .where(
            and(
              eq(teamToolSettings.teamId, teamId),
              eq(teamToolSettings.toolKey, toolKey)
            )
          )
          .limit(1)

        previousValue = existing.length ? existing[0].settings : null

        // Update team settings to defaults
        await db
          .update(teamToolSettings)
          .set({
            settings: defaultSettings,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(teamToolSettings.teamId, teamId),
              eq(teamToolSettings.toolKey, toolKey)
            )
          )
      } else {
        // Get existing global settings
        const existing = await db
          .select()
          .from(globalToolSettings)
          .where(eq(globalToolSettings.toolKey, toolKey))
          .limit(1)

        previousValue = existing.length ? existing[0].settings : null

        // Update global settings to defaults
        await db
          .update(globalToolSettings)
          .set({
            settings: defaultSettings,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(globalToolSettings.toolKey, toolKey))
      }

      // Log activity
      await db.insert(settingsActivityLog).values({
        teamId: teamId || null,
        toolKey,
        action: 'reset',
        previousValue,
        newValue: defaultSettings,
        userId,
        scope: teamId ? 'team' : 'global',
        metadata: {
          toolName: toolSchema[0].name,
        },
      })

      return {
        success: true,
        data: {
          toolKey,
          settings: defaultSettings,
          isGlobal: !teamId,
        },
      }
    } catch (error) {
      console.error('Error resetting tool settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset tool settings',
      }
    }
  })

// Get all team settings for a specific team
export const serverGetTeamToolSettings = createServerFn()
  .validator(z.object({ teamId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { teamId } = data

    try {
      const teamSettings = await db
        .select({
          toolKey: teamToolSettings.toolKey,
          settings: teamToolSettings.settings,
          isActive: teamToolSettings.isActive,
          updatedAt: teamToolSettings.updatedAt,
          schema: toolSettingsSchema,
        })
        .from(teamToolSettings)
        .leftJoin(toolSettingsSchema, eq(teamToolSettings.toolKey, toolSettingsSchema.toolKey))
        .where(eq(teamToolSettings.teamId, teamId))

      return {
        success: true,
        data: teamSettings,
      }
    } catch (error) {
      console.error('Error getting team tool settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get team tool settings',
      }
    }
  })