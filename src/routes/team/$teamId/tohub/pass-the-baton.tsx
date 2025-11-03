// routes/team/$teamId/tohub/pass-the-baton.tsx

import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { TurnoverForm } from '@/components/turnover/turnover-form'
import { TohubLayout } from '@/components/layout/tohub-layout'
import { AuthProvider } from '@/contexts/auth-context'
import { useAuthContext } from '@/contexts/auth-context'
import { 
  serverGetLatestTurnover, 
  serverCreateTurnover, 
  serverUpdateTurnover
} from '@/lib/server/turnovers'
import { getTeamApplications } from '@/lib/server/applications'
import { serverGetSubApplications } from '@/lib/server/sub-applications'
import {
  Users,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileText,
  TrendingUp,
  RefreshCw,
  Save,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

export const Route = createFileRoute('/team/$teamId/tohub/pass-the-baton')({
  component: PassTheBaton,
})

function PassTheBaton() {
  const { teamId } = Route.useParams()
  
  return (
    <AuthProvider>
      <TohubLayout teamId={teamId}>
        <PassTheBatonContent />
      </TohubLayout>
    </AuthProvider>
  )
}

function PassTheBatonContent() {
  const { teams } = useAuthContext()
  const { teamId } = Route.useParams()
  const queryClient = useQueryClient()

  const [selectedApplication, setSelectedApplication] = useState<string>('')
  const [selectedSubApplication, setSelectedSubApplication] = useState<string>('')
  const [isFormMode, setIsFormMode] = useState(false)
  const [editingTurnover, setEditingTurnover] = useState<any>(null)
  const [expandedApplication, setExpandedApplication] = useState<string>('')

  const currentTeam = teams.find(team => team.id === teamId)

  // Fetch applications for the team
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['team-applications', teamId],
    queryFn: () => getTeamApplications({ data: teamId }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch all sub-applications for the team
  const { data: allSubApplicationsData, isLoading: allSubApplicationsLoading } = useQuery({
    queryKey: ['all-sub-applications', teamId],
    queryFn: () => serverGetSubApplications({ data: { applicationId: 'all' } }),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch sub-applications for selected application
  const { data: subApplicationsData, isLoading: subApplicationsLoading } = useQuery({
    queryKey: ['sub-applications', selectedApplication],
    queryFn: () => selectedApplication ? serverGetSubApplications({ data: { applicationId: selectedApplication } }) : null,
    enabled: !!selectedApplication,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch latest turnover for current selection
  const { data: latestTurnoverData, isLoading: latestTurnoverLoading, refetch: refetchLatestTurnover } = useQuery({
    queryKey: ['latest-turnover', teamId, selectedApplication, selectedSubApplication],
    queryFn: () => serverGetLatestTurnover({ 
      data: { 
        teamId, 
        applicationId: selectedApplication || undefined,
        subApplicationId: selectedSubApplication || undefined 
      } 
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Create turnover mutation
  const createTurnoverMutation = useMutation({
    mutationFn: serverCreateTurnover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-turnover'] })
      queryClient.invalidateQueries({ queryKey: ['turnovers'] })
      setIsFormMode(false)
      setEditingTurnover(null)
    },
  })

  // Update turnover mutation
  const updateTurnoverMutation = useMutation({
    mutationFn: serverUpdateTurnover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-turnover'] })
      queryClient.invalidateQueries({ queryKey: ['turnovers'] })
      setIsFormMode(false)
      setEditingTurnover(null)
    },
  })

  const applications = applicationsData?.success ? applicationsData.data : []
  const subApplications = subApplicationsData?.success ? subApplicationsData.data : []
  const allSubApplications = allSubApplicationsData?.success ? allSubApplicationsData.data : []
  const latestTurnover = latestTurnoverData?.success ? latestTurnoverData.data : null

  const handleCreateNew = () => {
    setEditingTurnover(null)
    setIsFormMode(true)
  }

  const handleEdit = () => {
    setEditingTurnover(latestTurnover)
    setIsFormMode(true)
  }

  const handleSaveTurnover = async (formData: any) => {
    try {
      if (editingTurnover) {
        // Update existing turnover
        await updateTurnoverMutation.mutateAsync({
          data: {
            id: editingTurnover.id,
            handoverFrom: formData.handoverFrom,
            handoverTo: formData.handoverTo,
            status: 'active',
          }
        })
      } else {
        // Create new turnover
        const result = await createTurnoverMutation.mutateAsync({
          data: {
            teamId,
            applicationId: formData.applicationId,
            subApplicationId: formData.subApplicationId,
            handoverFrom: formData.handoverFrom,
            handoverTo: formData.handoverTo,
          }
        })

        if (result.success && formData.entries.length > 0) {
          // Create entries for the new turnover
          // This would need to be implemented with serverCreateTurnoverEntry calls
          console.log('Would create entries:', formData.entries)
        }
      }
    } catch (error) {
      console.error('Error saving turnover:', error)
    }
  }

  const handleCancel = () => {
    setIsFormMode(false)
    setEditingTurnover(null)
  }

  const getApplicationStats = () => {
    if (!latestTurnover) return { total: 0, flagged: 0, needsAction: 0 }

    const total = latestTurnover.entries.length
    const flagged = latestTurnover.entries.filter((entry: any) => 
      entry.priority === 'flagged' || entry.priority === 'important'
    ).length
    const needsAction = latestTurnover.entries.filter((entry: any) => 
      entry.priority === 'needs_action' || entry.priority === 'long_pending'
    ).length

    return { total, flagged, needsAction }
  }

  if (!currentTeam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Not Found</h1>
          <p className="text-gray-600">The team you're looking for doesn't exist or you don't have access.</p>
        </div>
      </div>
    )
  }

  // Removed the separate form mode since we're showing the form inline

  return (
    <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pass the Baton
              </h1>
              <p className="text-gray-600 mt-1">
                {currentTeam.teamName} - Turnover Management
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetchLatestTurnover()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Turnover
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Application Selection in Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Applications
              </CardTitle>
              <CardDescription>
                Select an application to manage turnovers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedApplication} onValueChange={setSelectedApplication} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  <TabsTrigger value="">All Applications</TabsTrigger>
                  {applications?.map((app: any) => (
                    <TabsTrigger key={app.id} value={app.id}>
                      {app.applicationName}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {applications?.map((app: any) => (
                  <TabsContent key={app.id} value={app.id} className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <h3 className="font-medium">{app.applicationName}</h3>
                          <p className="text-sm text-gray-600">TLA: {app.tla}</p>
                        </div>
                        <Badge variant="outline">{app.status}</Badge>
                      </div>
                      
                      {/* Turnover Form */}
                      <div className="mt-4">
                        <TurnoverForm
                          teamId={teamId}
                          applications={applications}
                          subApplications={allSubApplications || []}
                          initialData={editingTurnover}
                          onSave={handleSaveTurnover}
                          onCancel={handleCancel}
                          applicationId={app.id}
                        />
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Latest Turnover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-6"
        >
          {latestTurnoverLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : latestTurnover ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getApplicationStats().total}</div>
                    <p className="text-xs text-muted-foreground">
                      Across all sections
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{getApplicationStats().flagged}</div>
                    <p className="text-xs text-muted-foreground">
                      Require attention
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Needs Action</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{getApplicationStats().needsAction}</div>
                    <p className="text-xs text-muted-foreground">
                      Urgent items
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {latestTurnover.updatedAt ? new Date(latestTurnover.updatedAt).toLocaleDateString() : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {latestTurnover.updatedAt ? new Date(latestTurnover.updatedAt).toLocaleTimeString() : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Current Turnover */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Current Turnover
                      </CardTitle>
                      <CardDescription>
                        {latestTurnover.handoverFrom} → {latestTurnover.handoverTo}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {latestTurnover.status}
                      </Badge>
                      <Button onClick={handleEdit}>
                        <Save className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Handover Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-600">From</label>
                        <p className="text-lg font-semibold">{latestTurnover.handoverFrom}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">To</label>
                        <p className="text-lg font-semibold">{latestTurnover.handoverTo}</p>
                      </div>
                    </div>

                    {/* Entries Summary */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Entries Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {['rfc', 'inc', 'alert', 'mim', 'email_slack', 'fyi'].map((type) => {
                          const entries = latestTurnover.entries.filter((entry: any) => entry.entryType === type)
                          const count = entries.length
                          const flaggedCount = entries.filter((entry: any) => 
                            entry.priority === 'flagged' || entry.priority === 'needs_action'
                          ).length

                          return (
                            <div key={type} className="text-center p-3 border rounded-lg">
                              <div className="text-2xl font-bold">{count}</div>
                              <div className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</div>
                              {flaggedCount > 0 && (
                                <Badge variant="destructive" className="mt-1 text-xs">
                                  {flaggedCount} flagged
                                </Badge>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Recent Entries */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Recent Entries</h3>
                      <div className="space-y-2">
                        {latestTurnover.entries.slice(0, 5).map((entry: any) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <div>
                                <div className="font-medium capitalize">
                                  {entry.entryType.replace('_', ' ')}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {entry.entryType === 'rfc' && entry.rfcNumber}
                                  {entry.entryType === 'inc' && entry.incNumber}
                                  {entry.entryType === 'alert' && entry.alertsIssues?.substring(0, 50)}
                                  {entry.entryType === 'mim' && entry.mimLink}
                                  {entry.entryType === 'email_slack' && entry.emailSubjectSlackLink}
                                  {entry.entryType === 'fyi' && entry.fyiInfo?.substring(0, 50)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={entry.priority === 'normal' ? 'outline' : 'secondary'}>
                                {entry.priority.replace('_', ' ')}
                              </Badge>
                              <div className="text-xs text-gray-500">
                                {new Date(entry.updatedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Turnover Found</h3>
                <p className="text-gray-600 mb-6">
                  There's no turnover for the selected application/sub-application yet.
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Turnover
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
    </div>
  )
}
