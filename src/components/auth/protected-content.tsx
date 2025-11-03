// Protected Content Component
// Conditionally renders content based on user permissions

import { ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Lock, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthContext } from '@/contexts/auth-context'
import type { TeamAccessLevel } from '@/lib/server/auth'

interface ProtectedContentProps {
  children: ReactNode
  fallback?: ReactNode
  requireAccess?: boolean
  requireAdmin?: boolean
  teamId?: string
  accessLevel?: TeamAccessLevel
  className?: string
  showAccessDenied?: boolean
}

/**
 * Component that conditionally renders content based on user permissions
 */
export function ProtectedContent({
  children,
  fallback,
  requireAccess = true,
  requireAdmin = false,
  teamId,
  accessLevel,
  className,
  showAccessDenied = true
}: ProtectedContentProps) {
  const { 
    hasAccess, 
    isAdmin, 
    hasTeamAccess, 
    hasAdminAccess, 
    getTeamAccess 
  } = useAuthContext()

  // Check if user has required access
  let hasRequiredAccess = true
  let denialReason = ''

  // Check basic access requirements
  if (requireAccess && !hasAccess) {
    hasRequiredAccess = false
    denialReason = 'You need team access to view this content'
  }

  // Check admin requirements
  if (hasRequiredAccess && requireAdmin && !isAdmin) {
    hasRequiredAccess = false
    denialReason = 'Administrator access required to view this content'
  }

  // Check team-specific requirements
  if (hasRequiredAccess && teamId) {
    const teamAccessLevel = getTeamAccess(teamId)
    
    if (requireAdmin && !hasAdminAccess(teamId)) {
      hasRequiredAccess = false
      denialReason = `Team administrator access required for this team`
    } else if (requireAccess && !hasTeamAccess(teamId)) {
      hasRequiredAccess = false
      denialReason = `Team access required to view this content`
    }
  }

  // Check specific access level requirements
  if (hasRequiredAccess && teamId && accessLevel) {
    const teamAccessLevel = getTeamAccess(teamId)
    
    if (accessLevel === 'admin' && teamAccessLevel !== 'admin') {
      hasRequiredAccess = false
      denialReason = 'Administrator access required for this content'
    } else if (accessLevel === 'user' && teamAccessLevel === 'none') {
      hasRequiredAccess = false
      denialReason = 'Team member access required for this content'
    }
  }

  // Render content if user has access
  if (hasRequiredAccess) {
    return <div className={cn(className)}>{children}</div>
  }

  // Render fallback if provided
  if (fallback) {
    return <div className={cn(className)}>{fallback}</div>
  }

  // Render access denied message if enabled
  if (showAccessDenied) {
    return (
      <div className={cn('w-full', className)}>
        <AccessDeniedMessage reason={denialReason} />
      </div>
    )
  }

  // Render nothing
  return null
}

/**
 * Props for RequireAdmin component
 */
interface RequireAdminProps {
  children: ReactNode
  fallback?: ReactNode
  teamId?: string
  className?: string
  showAccessDenied?: boolean
}

/**
 * Component that requires admin access
 */
export function RequireAdmin({
  children,
  fallback,
  teamId,
  className,
  showAccessDenied = true
}: RequireAdminProps) {
  return (
    <ProtectedContent
      requireAdmin={true}
      teamId={teamId}
      fallback={fallback}
      className={className}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </ProtectedContent>
  )
}

/**
 * Props for RequireTeamAccess component
 */
interface RequireTeamAccessProps {
  children: ReactNode
  teamId: string
  accessLevel?: TeamAccessLevel
  fallback?: ReactNode
  className?: string
  showAccessDenied?: boolean
}

/**
 * Component that requires team access
 */
export function RequireTeamAccess({
  children,
  teamId,
  accessLevel,
  fallback,
  className,
  showAccessDenied = true
}: RequireTeamAccessProps) {
  return (
    <ProtectedContent
      requireAccess={true}
      teamId={teamId}
      accessLevel={accessLevel}
      fallback={fallback}
      className={className}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </ProtectedContent>
  )
}

/**
 * Props for RequireAnyAccess component
 */
interface RequireAnyAccessProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
  showAccessDenied?: boolean
}

/**
 * Component that requires any team access
 */
export function RequireAnyAccess({
  children,
  fallback,
  className,
  showAccessDenied = true
}: RequireAnyAccessProps) {
  return (
    <ProtectedContent
      requireAccess={true}
      fallback={fallback}
      className={className}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </ProtectedContent>
  )
}

/**
 * Access denied message component
 */
interface AccessDeniedMessageProps {
  reason?: string
  variant?: 'default' | 'compact'
}

function AccessDeniedMessage({ 
  reason = 'Access denied', 
  variant = 'default' 
}: AccessDeniedMessageProps) {
  if (variant === 'compact') {
    return (
      <Alert variant="destructive" className="flex items-center">
        <Lock className="h-4 w-4" />
        <AlertDescription className="text-sm">
          {reason}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" className="flex items-start space-x-3">
      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <AlertDescription className="font-medium mb-1">
          Access Denied
        </AlertDescription>
        <AlertDescription className="text-sm opacity-90">
          {reason}
        </AlertDescription>
      </div>
    </Alert>
  )
}

/**
 * Component for showing different content based on access level
 */
interface AccessBasedContentProps {
  teamId: string
  adminContent?: ReactNode
  userContent?: ReactNode
  noAccessContent?: ReactNode
  fallback?: ReactNode
  className?: string
}

export function AccessBasedContent({
  teamId,
  adminContent,
  userContent,
  noAccessContent,
  fallback,
  className
}: AccessBasedContentProps) {
  const { getTeamAccess } = useAuthContext()
  const accessLevel = getTeamAccess(teamId)

  const content = 
    accessLevel === 'admin' ? adminContent :
    accessLevel === 'user' ? userContent :
    noAccessContent

  if (content) {
    return <div className={cn(className)}>{content}</div>
  }

  if (fallback) {
    return <div className={cn(className)}>{fallback}</div>
  }

  return null
}

/**
 * Component for showing admin-only UI elements
 */
interface AdminOnlyProps {
  children: ReactNode
  teamId?: string
  fallback?: ReactNode
  className?: string
}

export function AdminOnly({ 
  children, 
  teamId, 
  fallback, 
  className 
}: AdminOnlyProps) {
  return (
    <RequireAdmin
      teamId={teamId}
      fallback={fallback}
      className={className}
      showAccessDenied={false}
    >
      {children}
    </RequireAdmin>
  )
}

/**
 * Component for showing team member-only UI elements
 */
interface TeamMemberOnlyProps {
  children: ReactNode
  teamId: string
  fallback?: ReactNode
  className?: string
}

export function TeamMemberOnly({ 
  children, 
  teamId, 
  fallback, 
  className 
}: TeamMemberOnlyProps) {
  return (
    <RequireTeamAccess
      teamId={teamId}
      fallback={fallback}
      className={className}
      showAccessDenied={false}
    >
      {children}
    </RequireTeamAccess>
  )
}