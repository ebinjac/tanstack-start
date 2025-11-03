// routes/team/$teamId/tohub/automation.tsx

import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TohubLayout } from '@/components/layout/tohub-layout'
import { AuthProvider } from '@/contexts/auth-context'
import { useAuthContext } from '@/contexts/auth-context'
import { 
  flagStaleEntries,
  createDailySnapshots,
  getAutomationStatus,
  scheduleAutomationTasks,
  runAllAutomationTasks
} from '@/lib/server/automation'
import { 
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Play,
  Settings,
  Calendar,
  Activity,
  Target,
  FileText,
  TrendingUp,
  Zap,
  Bell
} from 'lucide-react'
import { format, subHours } from 'date-fns'

export const Route = createFileRoute('/team/$teamId/tohub/automation')({
  component: Automation,
})

function Automation() {
  const { teamId } = Route.useParams()
  
  return (
    <AuthProvider>
      <TohubLayout teamId={teamId}>
        <AutomationContent />
      </TohubLayout>
    </AuthProvider>
  )
}

function AutomationContent() {
  const { teams } = useAuthContext()
  const { teamId } = Route.useParams()
  const queryClient = useQueryClient()

  const [staleFlaggingEnabled, setStaleFlaggingEnabled] = useState(true)
  const [dailySnapshotsEnabled, setDailySnapshotsEnabled] = useState(true)
  const [staleFlaggingInterval, setStaleFlaggingEnabledInterval] = useState(6)
  const [dailySnapshotTime, setDailySnapshotTime] = useState('00:00')

  const currentTeam = teams.find(team => team.id === teamId)

  // Fetch automation status
  const { data: automationStatusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['automation-status', teamId],
    queryFn: () => getAutomationStatus({ data: { teamId } }),
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  // Mutations for automation tasks
  const flagStaleMutation = useMutation({
    mutationFn: flagStaleEntries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-status'] })
      queryClient.invalidateQueries({ queryKey: ['stale-entries'] })
    },
  })

  const createSnapshotMutation = useMutation({
    mutationFn: createDailySnapshots,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-status'] })
      queryClient.invalidateQueries({ queryKey: ['turnover-snapshots'] })
    },
  })

  const scheduleTasksMutation = useMutation({
    mutationFn: scheduleAutomationTasks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-status'] })
    },
  })

  const runAllTasksMutation = useMutation({
    mutationFn: runAllAutomationTasks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-status'] })
      queryClient.invalidateQueries({ queryKey: ['stale-entries'] })
      queryClient.invalidateQueries({ queryKey: ['turnover-snapshots'] })
    },
  })

  const automationStatus = automationStatusData?.success ? automationStatusData.data : null

  const handleFlagStaleEntries = async () => {
    try {
      await flagStaleMutation.mutateAsync({
        data: {
          teamId,
          hours: 24
        }
      })
    } catch (error) {
      console.error('Error flagging stale entries:', error)
    }
  }

  const handleCreateSnapshots = async () => {
    try {
      await createSnapshotMutation.mutateAsync({
        data: {
          teamId
        }
      })
    } catch (error) {
      console.error('Error creating snapshots:', error)
    }
  }

  const handleRunAllTasks = async () => {
    try {
      await runAllTasksMutation.mutateAsync({
        data: {
          teamId
        }
      })
    } catch (error) {
      console.error('Error running all tasks:', error)
    }
  }

  const handleSaveConfiguration = async () => {
    try {
      await scheduleTasksMutation.mutateAsync({
        data: {
          teamId,
          enableStaleFlagging: staleFlaggingEnabled,
          enableDailySnapshots: dailySnapshotsEnabled,
          staleFlaggingInterval: staleFlaggingInterval,
          dailySnapshotTime: dailySnapshotTime
        }
      })
    } catch (error) {
      console.error('Error saving configuration:', error)
    }
  }

  const formatLastRun = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    }
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
                Automation Settings
              </h1>
              <p className="text-gray-600 mt-1">
                {currentTeam.teamName} - Configure and monitor automation tasks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetchStatus()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleRunAllTasks} disabled={runAllTasksMutation.isPending}>
                <Play className="h-4 w-4 mr-2" />
                {runAllTasksMutation.isPending ? 'Running...' : 'Run All Tasks'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Automation Status
              </CardTitle>
              <CardDescription>
                Current status of automation tasks and schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : automationStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${automationStatus.automationEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium">Automation Status</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {automationStatus.automationEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Last Stale Flag Run</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {formatLastRun(automationStatus.lastStaleFlagRun)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Last Snapshot Run</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {formatLastRun(automationStatus.lastSnapshotRun)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Recent Snapshots</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {automationStatus.recentSnapshots?.length || 0}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Status Unavailable</h3>
                  <p className="text-gray-600">
                    Unable to fetch automation status
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automation Configuration
              </CardTitle>
              <CardDescription>
                Configure automation tasks and schedules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stale Entries Flagging */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="stale-flagging" className="text-base font-medium">
                      Stale Entries Flagging
                    </Label>
                    <p className="text-sm text-gray-600">
                      Automatically flag entries that haven't been updated in a specified time
                    </p>
                  </div>
                  <Switch
                    id="stale-flagging"
                    checked={staleFlaggingEnabled}
                    onCheckedChange={setStaleFlaggingEnabled}
                  />
                </div>

                {staleFlaggingEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="flag-interval">Check Interval (hours)</Label>
                      <Select
                        value={staleFlaggingInterval.toString()}
                        onValueChange={(value) => setStaleFlaggingEnabledInterval(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Every hour</SelectItem>
                          <SelectItem value="3">Every 3 hours</SelectItem>
                          <SelectItem value="6">Every 6 hours</SelectItem>
                          <SelectItem value="12">Every 12 hours</SelectItem>
                          <SelectItem value="24">Daily</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Manual Trigger</Label>
                      <Button
                        variant="outline"
                        onClick={handleFlagStaleEntries}
                        disabled={flagStaleMutation.isPending}
                        className="w-full"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {flagStaleMutation.isPending ? 'Running...' : 'Flag Stale Entries Now'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Daily Snapshots */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="daily-snapshots" className="text-base font-medium">
                      Daily Snapshots
                    </Label>
                    <p className="text-sm text-gray-600">
                      Automatically create daily snapshots of all active turnovers
                    </p>
                  </div>
                  <Switch
                    id="daily-snapshots"
                    checked={dailySnapshotsEnabled}
                    onCheckedChange={setDailySnapshotsEnabled}
                  />
                </div>

                {dailySnapshotsEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="snapshot-time">Snapshot Time</Label>
                      <Input
                        id="snapshot-time"
                        type="time"
                        value={dailySnapshotTime}
                        onChange={(e) => setDailySnapshotTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Manual Trigger</Label>
                      <Button
                        variant="outline"
                        onClick={handleCreateSnapshots}
                        disabled={createSnapshotMutation.isPending}
                        className="w-full"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {createSnapshotMutation.isPending ? 'Creating...' : 'Create Snapshots Now'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Save Configuration */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveConfiguration}
                  disabled={scheduleTasksMutation.isPending}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {scheduleTasksMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stale Entries Summary */}
        {automationStatus?.staleEntriesByPriority && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Stale Entries Summary
                </CardTitle>
                <CardDescription>
                  Current count of stale entries by priority level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {automationStatus.staleEntriesByPriority.map((item: any) => (
                    <div key={item.priority} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{item.count}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {item.priority.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Snapshots */}
        {automationStatus?.recentSnapshots && automationStatus.recentSnapshots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Snapshots
                </CardTitle>
                <CardDescription>
                  Latest automated snapshots created for your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {automationStatus.recentSnapshots.slice(0, 5).map((snapshot: any) => (
                    <div key={snapshot.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {format(new Date(snapshot.snapshotDate), 'PPP')}
                        </div>
                        <div className="text-sm text-gray-600">
                          Created: {format(new Date(snapshot.createdAt), 'p')}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {Array.isArray(snapshot.turnoverData) ? snapshot.turnoverData.length : 1} turnover(s)
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Task Results */}
        {(flagStaleMutation.data || createSnapshotMutation.data || runAllTasksMutation.data) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Task Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flagStaleMutation.data && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {flagStaleMutation.data.success 
                          ? `Successfully flagged ${flagStaleMutation.data.data?.flaggedCount || 0} stale entries.`
                          : flagStaleMutation.data.error
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {createSnapshotMutation.data && (
                    <Alert>
                      <Calendar className="h-4 w-4" />
                      <AlertDescription>
                        {createSnapshotMutation.data.success 
                          ? `Successfully created ${createSnapshotMutation.data.data?.snapshotCount || 0} daily snapshots.`
                          : createSnapshotMutation.data.error
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {runAllTasksMutation.data && (
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        {runAllTasksMutation.data.success 
                          ? 'All automation tasks completed successfully.'
                          : runAllTasksMutation.data.error
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
    </div>
  )
}
