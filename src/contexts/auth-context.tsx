// Auth context
// Provides authentication and authorization data throughout the application

import { createContext, useContext, Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import type { SSOUser } from '@/hooks/use-authblue-sso'
import type { TeamWithAccess, TeamAccessLevel } from '@/lib/server/auth'
import { useAuth } from '@/hooks/use-auth'
import EnsembleLogo from '@/components/ensemble-logo'

// Auth context interface
export interface AuthContextValue {
  // User information
  user: SSOUser | null
  
  // Team information
  teams: TeamWithAccess[]
  currentTeam: TeamWithAccess | null
  
  // Access state
  hasAccess: boolean
  isAdmin: boolean
  
  // Loading and error states
  isLoading: boolean
  error: Error | null
  
  // Methods
  setCurrentTeam: (teamId: string) => void
  
  // Convenience methods
  getTeamAccess: (teamId: string) => TeamAccessLevel
  hasTeamAccess: (teamId: string) => boolean
  hasAdminAccess: (teamId: string) => boolean
  getTeamsByAccess: (accessLevel: TeamAccessLevel) => TeamWithAccess[]
}

// Create context with default values
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Props for AuthProvider
interface AuthProviderProps {
  children: React.ReactNode
}

// Loading fallback component
function AuthLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center max-w-md mx-auto p-8"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 mx-auto mb-8"
        >
          <EnsembleLogo />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-primary rounded-full animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Authenticating</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your credentials...
            </p>
          </div>
          
          <div className="flex justify-center space-x-2 pt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.3,
                  delay: 0.5 + i * 0.1,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="w-2 h-2 bg-primary rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Error fallback component
function AuthErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200 max-w-md">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          Authentication Error
        </h2>
        <p className="text-red-600 mb-4">
          {error.message || 'Failed to load authentication data'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  // We'll use the useAuth hook inside the provider
  // This ensures the auth data is available to all consumers
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </Suspense>
  )
}

// Inner component that uses the auth hook
function AuthProviderInner({ children }: AuthProviderProps) {
  const authData = useAuth()
  const [currentTeam, setCurrentTeam] = useState<TeamWithAccess | null>(null)

  // Convenience methods
  const getTeamAccess = (teamId: string): TeamAccessLevel => {
    const team = authData.teams.find((t: TeamWithAccess) => t.id === teamId)
    return team?.accessLevel || 'none'
  }

  const hasTeamAccess = (teamId: string): boolean => {
    return getTeamAccess(teamId) !== 'none'
  }

  const hasAdminAccess = (teamId: string): boolean => {
    return getTeamAccess(teamId) === 'admin'
  }

  const getTeamsByAccess = (accessLevel: TeamAccessLevel): TeamWithAccess[] => {
    return authData.teams.filter((team: TeamWithAccess) => team.accessLevel === accessLevel)
  }

  const handleSetCurrentTeam = (teamId: string) => {
    const team = authData.teams.find((t: TeamWithAccess) => t.id === teamId)
    setCurrentTeam(team || null)
  }

  // Context value
  const contextValue: AuthContextValue = {
    ...authData,
    currentTeam,
    setCurrentTeam: handleSetCurrentTeam,
    getTeamAccess,
    hasTeamAccess,
    hasAdminAccess,
    getTeamsByAccess,
  }

  // Handle error state
  if (authData.error) {
    return <AuthErrorFallback error={authData.error} />
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  
  return context
}

// Hook to get current user info
export function useCurrentUser() {
  const { user } = useAuthContext()
  return user
}

// Hook to get user teams
export function useUserTeams() {
  const { teams, hasAccess } = useAuthContext()
  return { teams, hasAccess }
}

// Hook to check if user is admin
export function useIsAdmin() {
  const { isAdmin } = useAuthContext()
  return isAdmin
}

// Hook to get teams with specific access level
export function useTeamsWithAccess(accessLevel: TeamAccessLevel) {
  const { getTeamsByAccess } = useAuthContext()
  return getTeamsByAccess(accessLevel)
}

// Higher-order component for protecting routes
export interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAccess?: boolean
  requireAdmin?: boolean
  teamId?: string
}

export function ProtectedRoute({ 
  children, 
  fallback, 
  requireAccess = true,
  requireAdmin = false,
  teamId 
}: ProtectedRouteProps) {
  const { hasAccess, isAdmin, hasTeamAccess, hasAdminAccess } = useAuthContext()

  // Check basic access requirements
  if (requireAccess && !hasAccess) {
    return fallback || <AccessDeniedContent message="Access required" />
  }

  // Check admin requirements
  if (requireAdmin && !isAdmin) {
    return fallback || <AccessDeniedContent message="Admin access required" />
  }

  // Check team-specific requirements
  if (teamId) {
    if (requireAdmin && !hasAdminAccess(teamId)) {
      return fallback || <AccessDeniedContent message="Team admin access required" />
    }
    if (requireAccess && !hasTeamAccess(teamId)) {
      return fallback || <AccessDeniedContent message="Team access required" />
    }
  }

  return <>{children}</>
}

// Access denied component
function AccessDeniedContent({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 bg-yellow-50 rounded-lg border border-yellow-200 max-w-md">
        <div className="text-yellow-600 text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">
          Access Denied
        </h2>
        <p className="text-yellow-700">
          {message}
        </p>
      </div>
    </div>
  )
}