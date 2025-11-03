import { db } from '@/db'
import { applications, teams } from '@/db/schema/teams'
import { eq, and, desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'

// Schema for Central API response
const CentralApiResponseSchema = z.object({
  data: z.object({
    application: z.object({
      name: z.string(),
      assetId: z.number(),
      lifeCycleStatus: z.string().optional(),
      risk: z.object({
        bia: z.string().optional(),
      }).optional(),
      ownershipInfo: z.object({
        applicationowner: z.object({
          email: z.string(),
          fullName: z.string(),
          band: z.string().optional(),
        }).optional(),
        applicationManager: z.object({
          email: z.string(),
          fullName: z.string(),
          band: z.string().optional(),
        }).optional(),
        applicationOwnerLeader1: z.object({
          email: z.string(),
          fullName: z.string(),
          band: z.string().optional(),
        }).optional(),
        applicationOwnerLeader2: z.object({
          email: z.string(),
          fullName: z.string(),
          band: z.string().optional(),
        }).optional(),
        ownerSVp: z.object({
          email: z.string(),
          fullName: z.string(),
          band: z.string().optional(),
        }).optional(),
        businessOwner: z.object({
          email: z.string(),
          fullName: z.string(),
          band: z.string().optional(),
        }).optional(),
        businessOwnerLeader1: z.object({
          email: z.string(),
          fullName: z.string(),
          band: z.string().optional(),
        }).optional(),
        productionSupportOwner: z.object({
          email: z.string(),
          fullName: z.string(),
          band: z.string().optional(),
        }).optional(),
        productionSupportOwnerLeader1: z.object({
          email: z.string(),
          fullName: z.string(),
          band: z.string().optional(),
        }).optional(),
        pmo: z.object({
          email: z.string(),
          fullName: z.string(),
          band: z.string().optional(),
        }).optional(),
        unitCIo: z.object({
          fullName: z.string().optional(),
        }).optional(),
      }).optional(),
    }),
  }),
})

// Schema for adding an application
const AddApplicationSchema = z.object({
  teamId: z.string().uuid(),
  assetId: z.string().min(1),
  tla: z.string().min(1).max(12),
  escalationEmail: z.string().email().optional(),
  contactEmail: z.string().email().optional(),
  teamEmail: z.string().email().optional(),
  snowGroup: z.string().max(255).optional(),
  slackChannel: z.string().max(100).optional(),
  description: z.string().optional(),
  createdBy: z.string().max(255),
})

// Schema for updating an application
const UpdateApplicationSchema = z.object({
  id: z.string().uuid(),
  tla: z.string().min(1).max(12).optional(),
  escalationEmail: z.string().email().optional(),
  contactEmail: z.string().email().optional(),
  teamEmail: z.string().email().optional(),
  snowGroup: z.string().max(255).optional(),
  slackChannel: z.string().max(100).optional(),
  description: z.string().optional(),
  updatedBy: z.string().max(255),
})

// Fetch application data from Central API
async function fetchApplicationFromCentralApi(assetId: string) {
  try {
    const response = await fetch(`http://localhost:8008/api/central?assetId=${assetId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Central API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const validatedData = CentralApiResponseSchema.parse(data)
    
    return validatedData.data.application
  } catch (error) {
    console.error('Error fetching application from Central API:', error)
    throw new Error(`Failed to fetch application from Central API: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Map Central API data to our database schema
function mapCentralApiDataToDb(centralData: any, additionalData: any) {
  const ownership = centralData.ownershipInfo || {}
  
  return {
    teamId: additionalData.teamId,
    assetId: centralData.assetId,
    applicationName: centralData.name,
    tla: additionalData.tla,
    lifeCycleStatus: centralData.lifeCycleStatus,
    tier: centralData.risk?.bia,
    vpName: ownership.productionSupportOwnerLeader1?.fullName,
    vpEmail: ownership.productionSupportOwnerLeader1?.email,
    directorName: ownership.productionSupportOwner?.fullName,
    directorEmail: ownership.productionSupportOwner?.email,
    escalationEmail: additionalData.escalationEmail,
    contactEmail: additionalData.contactEmail,
    teamEmail: additionalData.teamEmail,
    applicationOwnerName: ownership.applicationowner?.fullName,
    applicationOwnerEmail: ownership.applicationowner?.email,
    applicationOwnerBand: ownership.applicationowner?.band,
    applicationManagerName: ownership.applicationManager?.fullName,
    applicationManagerEmail: ownership.applicationManager?.email,
    applicationManagerBand: ownership.applicationManager?.band,
    applicationOwnerLeader1Name: ownership.applicationOwnerLeader1?.fullName,
    applicationOwnerLeader1Email: ownership.applicationOwnerLeader1?.email,
    applicationOwnerLeader1Band: ownership.applicationOwnerLeader1?.band,
    applicationOwnerLeader2Name: ownership.applicationOwnerLeader2?.fullName,
    applicationOwnerLeader2Email: ownership.applicationOwnerLeader2?.email,
    applicationOwnerLeader2Band: ownership.applicationOwnerLeader2?.band,
    ownerSvpName: ownership.ownerSVp?.fullName,
    ownerSvpEmail: ownership.ownerSVp?.email,
    ownerSvpBand: ownership.ownerSVp?.band,
    businessOwnerName: ownership.businessOwner?.fullName,
    businessOwnerEmail: ownership.businessOwner?.email,
    businessOwnerBand: ownership.businessOwner?.band,
    businessOwnerLeader1Name: ownership.businessOwnerLeader1?.fullName,
    businessOwnerLeader1Email: ownership.businessOwnerLeader1?.email,
    businessOwnerLeader1Band: ownership.businessOwnerLeader1?.band,
    productionSupportOwnerName: ownership.productionSupportOwner?.fullName,
    productionSupportOwnerEmail: ownership.productionSupportOwner?.email,
    productionSupportOwnerBand: ownership.productionSupportOwner?.band,
    productionSupportOwnerLeader1Name: ownership.productionSupportOwnerLeader1?.fullName,
    productionSupportOwnerLeader1Email: ownership.productionSupportOwnerLeader1?.email,
    productionSupportOwnerLeader1Band: ownership.productionSupportOwnerLeader1?.band,
    pmoName: ownership.pmo?.fullName,
    pmoEmail: ownership.pmo?.email,
    pmoBand: ownership.pmo?.band,
    unitCioName: ownership.unitCIo?.fullName,
    unitCioEmail: ownership.unitCIo?.email,
    unitCioBand: ownership.unitCIo?.band,
    snowGroup: additionalData.snowGroup,
    slackChannel: additionalData.slackChannel,
    description: additionalData.description,
    status: 'active',
    lastCentralApiSync: new Date(),
    centralApiSyncStatus: 'success',
    createdBy: additionalData.createdBy,
    updatedBy: additionalData.createdBy,
    updatedAt: new Date(),
  }
}

// Add a new application by fetching from Central API
export const addApplicationFromCentralApi = createServerFn({ method: 'POST' })
  .inputValidator(AddApplicationSchema)
  .handler(async ({ data }) => {
    try {
      // Check if application with this TLA already exists in this team
      const existingApp = await db.select()
        .from(applications)
        .where(and(
          eq(applications.tla, data.tla),
          eq(applications.teamId, data.teamId),
          eq(applications.status, 'active') // Only check active applications
        ))
        .limit(1)
      
      if (existingApp.length > 0) {
        throw new Error(`Application with TLA "${data.tla}" already exists in this team`)
      }
      
      // Fetch application data from Central API
      const centralData = await fetchApplicationFromCentralApi(data.assetId)
      
      // Convert asset ID to number for database operations
      const assetIdNumber = centralData.assetId || parseInt(data.assetId, 10)
      
      if (isNaN(assetIdNumber)) {
        throw new Error('Invalid Asset ID format')
      }
      
      // Map Central API data to our database schema
      const applicationData = mapCentralApiDataToDb(centralData, {
        ...data,
        assetId: assetIdNumber
      })
      
      // Insert the application
      const [newApplication] = await db.insert(applications)
        .values(applicationData)
        .returning()
      
      return {
        success: true,
        data: newApplication,
        message: 'Application added successfully'
      }
    } catch (error) {
      console.error('Error adding application:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to add application'
      }
    }
  })

// Get applications for a team
export const getTeamApplications = createServerFn()
  .inputValidator(z.string())
  .handler(async ({ data: teamId }) => {
    try {
      const teamApps = await db.select()
        .from(applications)
        .where(and(
          eq(applications.teamId, teamId),
          eq(applications.status, 'active')
        ))
        .orderBy(desc(applications.createdAt))
      
      return {
        success: true,
        data: teamApps
      }
    } catch (error) {
      console.error('Error fetching team applications:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch applications'
      }
    }
  })

// Get application by ID
export const getApplicationById = createServerFn()
  .inputValidator(z.string())
  .handler(async ({ data: applicationId }) => {
    try {
      const [application] = await db.select()
        .from(applications)
        .where(eq(applications.id, applicationId))
        .limit(1)
      
      if (!application) {
        throw new Error('Application not found')
      }
      
      return {
        success: true,
        data: application
      }
    } catch (error) {
      console.error('Error fetching application:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch application'
      }
    }
  })

// Update application
export const updateApplication = createServerFn({ method: 'POST' })
  .inputValidator(UpdateApplicationSchema)
  .handler(async ({ data }) => {
    try {
      // Check if another application with this TLA already exists in this team
      if (data.tla) {
        // Get the current application to find its team ID
        const [currentApp] = await db.select()
          .from(applications)
          .where(eq(applications.id, data.id))
          .limit(1)
        
        if (currentApp) {
          const existingApp = await db.select()
            .from(applications)
            .where(and(
              eq(applications.tla, data.tla),
              eq(applications.teamId, currentApp.teamId),
              eq(applications.status, 'active'), // Only check active applications
              // Exclude the current application from the check
              sql`${applications.id} != ${data.id}`
            ))
            .limit(1)
          
          if (existingApp.length > 0) {
            throw new Error(`Application with TLA "${data.tla}" already exists in this team`)
          }
        }
      }
      
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      }
      
      // Remove id from updateData
      delete updateData.id
      
      const [updatedApplication] = await db.update(applications)
        .set(updateData)
        .where(eq(applications.id, data.id))
        .returning()
      
      if (!updatedApplication) {
        throw new Error('Application not found')
      }
      
      return {
        success: true,
        data: updatedApplication,
        message: 'Application updated successfully'
      }
    } catch (error) {
      console.error('Error updating application:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update application'
      }
    }
  })

// Delete application
export const deleteApplication = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: applicationId }) => {
    try {
      const [deletedApplication] = await db.update(applications)
        .set({
          status: 'deleted',
          updatedAt: new Date(),
        })
        .where(eq(applications.id, applicationId))
        .returning()
      
      if (!deletedApplication) {
        throw new Error('Application not found')
      }
      
      return {
        success: true,
        data: deletedApplication,
        message: 'Application deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting application:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to delete application'
      }
    }
  })

// Sync application with Central API
export const syncApplicationWithCentralApi = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: applicationId }) => {
    try {
    // Get the application
    const appResult = await getApplicationById({ data: applicationId })
    if (!appResult.success || !appResult.data) {
      throw new Error('Application not found')
    }
    
    const application = appResult.data
    
    // Fetch updated data from Central API
    const centralData = await fetchApplicationFromCentralApi(application.assetId.toString())
    
    // Map Central API data to our database schema
    const updateData = mapCentralApiDataToDb(centralData, {
      teamId: application.teamId,
      tla: application.tla,
      escalationEmail: application.escalationEmail,
      contactEmail: application.contactEmail,
      teamEmail: application.teamEmail,
      snowGroup: application.snowGroup,
      slackChannel: application.slackChannel,
      description: application.description,
      createdBy: application.createdBy,
    })
    
    // Update the application
    const [updatedApplication] = await db.update(applications)
      .set({
        ...updateData,
        lastCentralApiSync: new Date(),
        centralApiSyncStatus: 'success',
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId))
      .returning()
    
    return {
      success: true,
      data: updatedApplication,
      message: 'Application synced successfully'
    }
  } catch (error) {
    console.error('Error syncing application:', error)
    
    // Update sync status to failed
    try {
      await db.update(applications)
        .set({
          centralApiSyncStatus: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(applications.id, applicationId))
    } catch (updateError) {
      console.error('Error updating sync status:', updateError)
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to sync application'
    }
    }
  })

// Get team details
export const getTeamDetails = createServerFn()
  .inputValidator(z.string())
  .handler(async ({ data: teamId }) => {
    try {
      const [team] = await db.select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1)
      
      if (!team) {
        throw new Error('Team not found')
      }
      
      // Get application count
      const [appCount] = await db.select({ count: sql<number>`count(*)` })
        .from(applications)
        .where(and(
          eq(applications.teamId, teamId),
          eq(applications.status, 'active')
        ))
      
      return {
        success: true,
        data: {
          ...team,
          applicationCount: appCount?.count || 0
        }
      }
    } catch (error) {
      console.error('Error fetching team details:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch team details'
      }
    }
  })

// Check if TLA is available for a team
export const checkTlaAvailability = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    tla: z.string().min(1, 'TLA is required').max(12, 'TLA must be 12 characters or less'),
    teamId: z.string().uuid(),
    applicationId: z.string().uuid().optional()
  }))
  .handler(async ({ data }) => {
    try {
      // Build the query conditions
      const conditions = [
        eq(applications.tla, data.tla),
        eq(applications.teamId, data.teamId),
        eq(applications.status, 'active')
      ]
      
      // If updating an application, exclude it from the check
      if (data.applicationId) {
        conditions.push(sql`${applications.id} != ${data.applicationId}`)
      }
      
      const existingApp = await db.select()
        .from(applications)
        .where(and(...conditions))
        .limit(1)
      
      return {
        success: true,
        data: {
          available: existingApp.length === 0,
          message: existingApp.length > 0
            ? `TLA "${data.tla}" is already used in this team`
            : `TLA "${data.tla}" is available`
        }
      }
    } catch (error) {
      console.error('Error checking TLA availability:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to check TLA availability'
      }
    }
  })