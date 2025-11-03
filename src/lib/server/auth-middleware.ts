// Auth middleware for server functions
// This middleware protects server functions based on user permissions

import { createMiddleware } from '@tanstack/react-start'
import { z } from 'zod'
import type { SSOUser } from '@/hooks/use-authblue-sso'

// Types for auth context
export interface AuthContext {
  user: SSOUser
  userGroups: string[]
}

// Schema for validating user data in middleware
const UserSchema = z.object({
  attributes: z.object({
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    adsId: z.string(),
    guid: z.string(),
    employeeId: z.string(),
    email: z.string().email(),
  }),
  groups: z.array(z.string()),
})

/**
 * Authentication middleware that validates and extracts user information
 * This middleware should be used to protect server functions that require authentication
 */
export const authMiddleware = createMiddleware()
  .server(async ({ next }) => {
    // In a real implementation, you would extract user info from the request
    // For now, we'll simulate getting user info from the request context
    // This would typically come from session cookies, JWT tokens, or SSO headers
    
    // For development/demo purposes, we'll use mock data
    // In production, this should be replaced with actual authentication logic
    const mockUser: SSOUser = {
      attributes: {
        firstName: "Ensemble",
        lastName: "Test",
        fullName: "Ensemble Test",
        adsId: "ensemble",
        guid: "@fca9376056149663519865855188315",
        employeeId: "8229989",
        email: "ensemble.test5@gmail.com",
      },
      groups: ["SSO_ENSEMBLE_E1"],
    }

    // Validate user data
    const validatedUser = UserSchema.parse(mockUser)

    // Create auth context
    const authContext: AuthContext = {
      user: validatedUser,
      userGroups: validatedUser.groups,
    }

    return next({
      context: authContext,
    })
  })

/**
 * Middleware to check if user has admin access to any team
 */
export const requireAdminAccess = createMiddleware()
  .server(async ({ next, context }) => {
    const authContext = context as unknown as AuthContext
    
    if (!authContext) {
      throw new Error('Authentication required')
    }

    // Check if user has admin groups
    const hasAdminGroup = authContext.userGroups.some(group => 
      group.includes('ADMIN') || group.includes('MANAGER')
    )

    if (!hasAdminGroup) {
      throw new Error('Admin access required')
    }

    return next({
      context: authContext,
    })
  })

/**
 * Middleware to check if user has access to a specific team
 * This would be used when the team ID is known in the request
 */
export const requireTeamAccess = createMiddleware()
  .server(async ({ next, context }) => {
    const authContext = context as unknown as AuthContext
    
    if (!authContext) {
      throw new Error('Authentication required')
    }

    // In a real implementation, you would:
    // 1. Extract team ID from request parameters
    // 2. Query database to get team's userGroup and adminGroup
    // 3. Check if user's groups match either group
    
    // For now, we'll just ensure the user is authenticated
    return next({
      context: authContext,
    })
  })

/**
 * Helper function to create team-specific access middleware
 * This allows creating middleware for specific team access requirements
 */
export const createTeamAccessMiddleware = (requiredAccessLevel: 'user' | 'admin') => {
  return createMiddleware()
    .server(async ({ next, context }) => {
      const authContext = context as unknown as AuthContext
      
      if (!authContext) {
        throw new Error('Authentication required')
      }

      // In a real implementation, you would:
      // 1. Get team information from database
      // 2. Check if user's groups match the required access level
      
      // For now, we'll just check if user has any groups (basic validation)
      if (authContext.userGroups.length === 0) {
        throw new Error(`${requiredAccessLevel} access required`)
      }

      return next({
        context: authContext,
      })
    })
}

/**
 * Middleware to extract user information from request headers
 * This is a placeholder for actual SSO integration
 */
export const extractUserFromRequest = createMiddleware()
  .server(async ({ next }) => {
    // In a real implementation, you would extract user info from:
    // - SSO headers (e.g., X-User-Info, X-User-Groups)
    // - JWT tokens from Authorization header
    // - Session cookies
    
    // For development, we'll use mock data
    const mockUser: SSOUser = {
      attributes: {
        firstName: "Ensemble",
        lastName: "Test",
        fullName: "Ensemble Test",
        adsId: "ensemble",
        guid: "@fca9376056149663519865855188315",
        employeeId: "8229989",
        email: "ensemble.test5@gmail.com",
      },
      groups: ["SSO_ENSEMBLE_E1"],
    }

    const authContext: AuthContext = {
      user: mockUser,
      userGroups: mockUser.groups,
    }

    return next({
      context: authContext,
    })
  })