// routes/team/$teamId/tohub/view-turnover-hub.tsx

import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { TohubLayout } from '@/components/layout/tohub-layout'
import { AuthProvider } from '@/contexts/auth-context'
import { useAuthContext } from '@/contexts/auth-context'
import { 
  serverGetLatestTurnover,
  serverGetTurnovers
} from '@/lib/server/turnovers'
import { getTeamApplications } from '@/lib/server/applications'
import { 
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Bell,
  Mail,
  Link as LinkIcon,
  RefreshCw,
  Download,
  Printer,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

export const Route = createFileRoute('/team/$teamId/tohub/view-turnover-hub')({
  component: ViewTurnoverHub,
})

function ViewTurnoverHub() {
  const { teamId } = Route.useParams()
  
  return (
    <AuthProvider>
      <TohubLayout teamId={teamId}>
        <ViewTurnoverHubContent />
      </TohubLayout>
    </AuthProvider>
  )
}

function ViewTurnoverHubContent() {
  const { teams } = useAuthContext()
  const { teamId } = Route.useParams()

  const [selectedApplication, setSelectedApplication] = useState<string>('')
  const [selectedSubApplication, setSelectedSubApplication] = useState<string>('')
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary')

  const currentTeam = teams.find(team => team.id === teamId)

  // Fetch applications for the team
  const { data: applicationsData } = useQuery({
    queryKey: ['team-applications', teamId],
    queryFn: () => getTeamApplications({ data: teamId }),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch all active turnovers for today
  const { data: turnoversData, isLoading: turnoversLoading, refetch: refetchTurnovers } = useQuery({
    queryKey: ['turnovers-today', teamId, selectedApplication, selectedSubApplication],
    queryFn: () => serverGetTurnovers({ 
      data: { 
        teamId, 
        applicationId: selectedApplication || undefined,
        subApplicationId: selectedSubApplication || undefined,
        status: 'active'
      } 
    }),
    staleTime: 2 * 60 * 1000,
  })

  const applications = applicationsData?.success ? applicationsData.data : []
  const turnovers = turnoversData?.success ? turnoversData.data : []

  // Get today's date
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  // Calculate statistics
  const getStatistics = () => {
    const stats = {
      totalTurnovers: turnovers?.length || 0,
      totalEntries: 0,
      flaggedEntries: 0,
      needsActionEntries: 0,
      entriesByType: {} as Record<string, number>,
      recentUpdates: 0
    }

    turnovers?.forEach(turnover => {
      // For now, we'll use mock data for entries since the server function doesn't include them
      // In a real implementation, we would fetch entries separately or include them in the turnover query
      const mockEntries: any[] = [] // This would be replaced with actual entries
      
      if (mockEntries.length > 0) {
        stats.totalEntries += mockEntries.length
        
        mockEntries.forEach((entry: any) => {
          // Count by type
          stats.entriesByType[entry.entryType] = (stats.entriesByType[entry.entryType] || 0) + 1
          
          // Count flagged and needs action
          if (entry.priority === 'flagged' || entry.priority === 'important') {
            stats.flaggedEntries++
          }
          if (entry.priority === 'needs_action' || entry.priority === 'long_pending') {
            stats.needsActionEntries++
          }
          
          // Count recent updates (last 2 hours)
          const twoHoursAgo = new Date()
          twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)
          if (new Date(entry.updatedAt) > twoHoursAgo) {
            stats.recentUpdates++
          }
        })
      }
    })

    return stats
  }

  const stats = getStatistics()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'normal': return 'bg-gray-100 text-gray-800'
      case 'important': return 'bg-blue-100 text-blue-800'
      case 'flagged': return 'bg-orange-100 text-orange-800'
      case 'needs_action': return 'bg-red-100 text-red-800'
      case 'long_pending': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEntryIcon = (entryType: string) => {
    switch (entryType) {
      case 'rfc': return FileText
      case 'inc': return AlertTriangle
      case 'alert': return Bell
      case 'mim': return LinkIcon
      case 'email_slack': return Mail
      case 'fyi': return Eye
      default: return FileText
    }
  }

  const getTrendIcon = (count: number, threshold: number) => {
    if (count > threshold) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (count < threshold) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented')
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

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                View Turnover Hub
              </h1>
              <p className="text-gray-600 mt-1">
                {currentTeam.teamName} - {today}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetchTurnovers()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Application Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Filter by Application</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Application</label>
                  <select
                    value={selectedApplication}
                    onChange={(e) => {
                      setSelectedApplication(e.target.value)
                      setSelectedSubApplication('')
                    }}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">All Applications</option>
                    {applications?.map((app: any) => (
                      <option key={app.id} value={app.id}>
                        {app.applicationName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">View Mode</label>
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as 'summary' | 'detailed')}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="summary">Summary View</option>
                    <option value="detailed">Detailed View</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    <strong>{stats.totalTurnovers}</strong> active turnovers
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {turnoversLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (turnovers?.length || 0) === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Turnovers</h3>
              <p className="text-gray-600">
                There are no active turnovers for the selected filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Statistics Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEntries}</div>
                    <p className="text-xs text-muted-foreground">
                      Across {stats.totalTurnovers} turnovers
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      {getTrendIcon(stats.flaggedEntries, 5)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.flaggedEntries}</div>
                    <p className="text-xs text-muted-foreground">
                      Require attention
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Needs Action</CardTitle>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {getTrendIcon(stats.needsActionEntries, 3)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.needsActionEntries}</div>
                    <p className="text-xs text-muted-foreground">
                      Urgent items
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Updates</CardTitle>
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.recentUpdates}</div>
                    <p className="text-xs text-muted-foreground">
                      Last 2 hours
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Turnovers Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="space-y-6"
            >
              {turnovers?.map((turnover: any, index: number) => (
                <motion.div
                  key={turnover.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {turnover.applicationName || 'General Turnover'}
                          </CardTitle>
                          <CardDescription>
                            {turnover.handoverFrom} → {turnover.handoverTo}
                            {turnover.subApplicationName && ` • ${turnover.subApplicationName}`}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            0 entries {/* TODO: Replace with actual entry count */}
                          </Badge>
                          <Badge variant="secondary">
                            {turnover.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {viewMode === 'summary' ? (
                        /* Summary View */
                        <div className="space-y-4">
                          {/* Entry Type Summary - Placeholder */}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {['rfc', 'inc', 'alert', 'mim', 'email_slack', 'fyi'].map((type) => (
                              <div key={type} className="text-center p-3 border rounded-lg">
                                <div className="text-2xl font-bold">0</div>
                                <div className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</div>
                              </div>
                            ))}
                          </div>

                          {/* Critical Items - Placeholder */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-600">No critical items</h4>
                            <p className="text-sm text-gray-500">
                              Entries will appear here once turnovers are populated with data.
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Detailed View */
                        <div className="space-y-6">
                          {/* Detailed View - Placeholder */}
                          <div className="space-y-6">
                            {['rfc', 'inc', 'alert', 'mim', 'email_slack', 'fyi'].map((entryType) => (
                              <div key={entryType} className="space-y-3">
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const Icon = getEntryIcon(entryType)
                                    return <Icon className="h-5 w-5" />
                                  })()}
                                  <h3 className="text-lg font-semibold capitalize">
                                    {entryType.replace('_', ' ')} Section
                                  </h3>
                                  <Badge variant="outline">0 items</Badge>
                                </div>
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                  <p>No entries in {entryType.replace('_', ' ')} section</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
    </div>
  )
}