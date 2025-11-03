import { createFileRoute, Outlet } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/auth-context'
import { useAuthContext } from '@/contexts/auth-context'
import { LinksSidebar } from '@/components/links/links-sidebar'
import { LinkForm } from '@/components/links/link-form'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import {
  serverGetApplications,
  serverGetCategories
} from '@/lib/server/links'
import { Suspense, useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/team/$teamId/links')({
  component: TeamLinksLayout,
})

function TeamLinksLayout() {
  return (
    <AuthProvider>
      <TeamLinksLayoutContent />
    </AuthProvider>
  )
}

function TeamLinksLayoutContent() {
  const { teams, currentTeam, setCurrentTeam } = useAuthContext()
  const { teamId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<any>(null)

  // Get categories and applications for sidebar
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', teamId],
    queryFn: () => serverGetCategories({ data: { teamId } }),
    staleTime: 5 * 60 * 1000,
  })

  const categories = categoriesData?.data || []

  // Set current team from route params
  useEffect(() => {
    if (teamId && currentTeam?.id !== teamId) {
      setCurrentTeam(teamId)
    }
  }, [teamId, currentTeam?.id, setCurrentTeam])

  // Fetch applications for the current team
  const { data: applicationsData } = useQuery({
    queryKey: ['applications', teamId],
    queryFn: () => serverGetApplications({ data: { teamId } }),
    staleTime: 5 * 60 * 1000,
  })

  const applications = applicationsData?.data || []

  const handleTeamChange = (newTeamId: string) => {
    navigate({ to: '/team/$teamId/links', params: { teamId: newTeamId } })
  }

  // Navigation is now handled directly by the sidebar using Link components

  const handleLinkFormSuccess = (link: any) => {
    queryClient.invalidateQueries({ queryKey: ['links', teamId] })
    toast.success(`Link ${editingLink ? 'updated' : 'created'} successfully`)
    setEditingLink(null)
    setIsCreateDialogOpen(false)
  }

  // Get current team from teams array
  const currentTeamData = teams.find(team => team.id === teamId)

  if (!currentTeamData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Team Not Found</h1>
            <p className="text-muted-foreground">The team you're looking for doesn't exist or you don't have access.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <LinksSidebar
            teamId={teamId}
            currentTeam={currentTeamData}
            teams={teams}
            applications={applications}
            onTeamChange={handleTeamChange}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<LinksContentSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      
      {/* Link Form Dialog */}
      <LinkForm
        teamId={teamId}
        open={isCreateDialogOpen || !!editingLink}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) setEditingLink(null)
        }}
        link={editingLink}
        onSuccess={handleLinkFormSuccess}
      />
    </div>
  )
}

// Skeleton component for the main content area only
function LinksContentSkeleton() {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header Skeleton */}
        <div className="p-6 border-b bg-background">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-20" />
              <div className="flex items-center border rounded-md">
                <Skeleton className="h-9 w-9 rounded-r-none" />
                <Skeleton className="h-9 w-9 rounded-l-none" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>

        {/* Links Content Skeleton */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {/* Loading indicator for refetching */}
            <div className="flex items-center justify-center py-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Loading...
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-4 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-20 w-full rounded-md" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-16" />
                    <div className="flex gap-1">
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-6 w-6 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}