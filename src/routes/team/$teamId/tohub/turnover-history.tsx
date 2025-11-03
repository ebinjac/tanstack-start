// routes/team/$teamId/tohub/turnover-history.tsx

import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TohubLayout } from '@/components/layout/tohub-layout'
import { AuthProvider } from '@/contexts/auth-context'
import { useAuthContext } from '@/contexts/auth-context'
import { 
  serverGetSnapshots,
  serverCreateDailySnapshot
} from '@/lib/server/turnovers'
import { getTeamApplications } from '@/lib/server/applications'
import { 
  Calendar as CalendarIcon,
  Clock,
  Users,
  FileText,
  AlertTriangle,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react'
import { format, subDays, addDays, startOfDay, endOfDay, isSameDay, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/team/$teamId/tohub/turnover-history')({
  component: TurnoverHistory,
})

function TurnoverHistory() {
  const { teamId } = Route.useParams()
  
  return (
    <AuthProvider>
      <TohubLayout teamId={teamId}>
        <TurnoverHistoryContent />
      </TohubLayout>
    </AuthProvider>
  )
}

function TurnoverHistoryContent() {
  const { teams } = useAuthContext()
  const { teamId } = Route.useParams()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedApplication, setSelectedApplication] = useState<string>('')
  const [selectedSubApplication, setSelectedSubApplication] = useState<string>('')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const currentTeam = teams.find(team => team.id === teamId)

  // Fetch applications for the team
  const { data: applicationsData } = useQuery({
    queryKey: ['team-applications', teamId],
    queryFn: () => getTeamApplications({ data: teamId }),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch snapshots for the selected date range
  const { data: snapshotsData, isLoading: snapshotsLoading, refetch: refetchSnapshots } = useQuery({
    queryKey: ['turnover-snapshots', teamId, selectedApplication, selectedSubApplication, selectedDate],
    queryFn: () => serverGetSnapshots({ 
      data: { 
        teamId, 
        applicationId: selectedApplication || undefined,
        subApplicationId: selectedSubApplication || undefined,
        startDate: format(startOfDay(subDays(selectedDate, 30)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        endDate: format(endOfDay(addDays(selectedDate, 1)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
      } 
    }),
    staleTime: 2 * 60 * 1000,
    enabled: !!selectedDate
  })

  const applications = applicationsData?.success ? applicationsData.data : []
  const snapshots = snapshotsData?.success ? snapshotsData.data : []

  // Get dates with snapshots for calendar highlighting
  const getDatesWithSnapshots = () => {
    const dates = new Set<Date>()
    snapshots?.forEach(snapshot => {
      dates.add(parseISO(snapshot.snapshotDate.toISOString()))
    })
    return dates
  }

  // Get snapshot for selected date
  const getSnapshotForDate = (date: Date) => {
    return snapshots?.find(snapshot => 
      isSameDay(parseISO(snapshot.snapshotDate.toISOString()), date)
    )
  }

  // Navigate to previous/next day with snapshot
  const navigateToNearestSnapshot = (direction: 'prev' | 'next') => {
    const sortedDates = Array.from(getDatesWithSnapshots()).sort((a, b) => a.getTime() - b.getTime())
    const currentIndex = sortedDates.findIndex(date => isSameDay(date, selectedDate))
    
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedDate(sortedDates[currentIndex - 1])
    } else if (direction === 'next' && currentIndex < sortedDates.length - 1) {
      setSelectedDate(sortedDates[currentIndex + 1])
    }
  }

  // Create manual snapshot for current date
  const createSnapshotMutation = useMutation({
    mutationFn: serverCreateDailySnapshot,
    onSuccess: () => {
      refetchSnapshots()
    },
  })

  const handleCreateSnapshot = async () => {
    try {
      await createSnapshotMutation.mutateAsync({
        data: {
          teamId,
          applicationId: selectedApplication || undefined,
          subApplicationId: selectedSubApplication || undefined,
          snapshotDate: format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
        }
      })
    } catch (error) {
      console.error('Error creating snapshot:', error)
    }
  }

  const handleExportSnapshot = (snapshot: any) => {
    // Create a downloadable JSON file
    const dataStr = JSON.stringify(snapshot.turnoverData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `turnover-snapshot-${format(snapshot.snapshotDate, 'yyyy-MM-dd')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getEntryIcon = (entryType: string) => {
    switch (entryType) {
      case 'rfc': return FileText
      case 'inc': return AlertTriangle
      case 'alert': return <AlertTriangle className="h-4 w-4" />
      case 'mim': return <FileText className="h-4 w-4" />
      case 'email_slack': return <FileText className="h-4 w-4" />
      case 'fyi': return <FileText className="h-4 w-4" />
      default: return FileText
    }
  }

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

  const currentSnapshot = getSnapshotForDate(selectedDate)
  const datesWithSnapshots = getDatesWithSnapshots()

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
                Turnover History
              </h1>
              <p className="text-gray-600 mt-1">
                {currentTeam.teamName} - Historical turnover snapshots
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetchSnapshots()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleCreateSnapshot} disabled={createSnapshotMutation.isPending}>
                <Clock className="h-4 w-4 mr-2" />
                {createSnapshotMutation.isPending ? 'Creating...' : 'Create Snapshot'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Navigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Date</label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(date)
                            setIsCalendarOpen(false)
                          }
                        }}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        modifiers={{
                          highlighted: Array.from(datesWithSnapshots)
                        }}
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Application Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Application</label>
                  <Select
                    value={selectedApplication}
                    onValueChange={(value) => setSelectedApplication(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Applications" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Applications</SelectItem>
                      {applications?.map((app: any) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.applicationName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* View Mode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">View Mode</label>
                  <Select
                    value={viewMode}
                    onValueChange={(value) => setViewMode(value as 'calendar' | 'list')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="calendar">Calendar View</SelectItem>
                      <SelectItem value="list">List View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Navigation */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Navigation</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(subDays(new Date(), 1))}
                    >
                      Yesterday
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(subDays(new Date(), 2))}
                    >
                      Day Before
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{format(selectedDate, 'MMMM yyyy')}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToNearestSnapshot('prev')}
                        disabled={!datesWithSnapshots.size}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToNearestSnapshot('next')}
                        disabled={!datesWithSnapshots.size}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                    modifiers={{
                      highlighted: Array.from(datesWithSnapshots)
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Selected Date Snapshot */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{format(selectedDate, 'PPP')}</span>
                    {currentSnapshot && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportSnapshot(currentSnapshot)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {snapshotsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : currentSnapshot ? (
                    <div className="space-y-4">
                      <div className="text-sm">
                        <span className="font-medium">Snapshot ID:</span> {currentSnapshot.id}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Created:</span> {format(currentSnapshot.createdAt, 'PPP p')}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Turnovers:</span> {Array.isArray(currentSnapshot.turnoverData) ? currentSnapshot.turnoverData.length : 1}
                      </div>
                      
                      <Separator />
                      
                      {/* Summary of turnover data */}
                      {Array.isArray(currentSnapshot.turnoverData) && currentSnapshot.turnoverData.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Turnovers Summary</h4>
                          {currentSnapshot.turnoverData.slice(0, 3).map((turnover: any, index: number) => (
                            <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="font-medium">{turnover.handoverFrom} → {turnover.handoverTo}</div>
                              <div className="text-gray-600">
                                {turnover.entries?.length || 0} entries
                              </div>
                            </div>
                          ))}
                          {currentSnapshot.turnoverData.length > 3 && (
                            <div className="text-sm text-gray-500">
                              ...and {currentSnapshot.turnoverData.length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Snapshot</h3>
                      <p className="text-gray-600 text-sm">
                        No snapshot found for this date
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="space-y-6"
          >
            {snapshotsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-64 mb-4" />
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : snapshots && snapshots.length > 0 ? (
              snapshots.map((snapshot: any) => (
                <motion.div
                  key={snapshot.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            {format(snapshot.snapshotDate, 'PPP')}
                          </CardTitle>
                          <CardDescription>
                            Created: {format(snapshot.createdAt, 'PPP p')}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {Array.isArray(snapshot.turnoverData) ? snapshot.turnoverData.length : 1} turnover(s)
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportSnapshot(snapshot)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Display turnover data summary */}
                      {Array.isArray(snapshot.turnoverData) && snapshot.turnoverData.length > 0 ? (
                        <div className="space-y-4">
                          {snapshot.turnoverData.map((turnover: any, index: number) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span className="font-medium">
                                    {turnover.handoverFrom} → {turnover.handoverTo}
                                  </span>
                                </div>
                                <Badge variant="outline">
                                  {turnover.entries?.length || 0} entries
                                </Badge>
                              </div>
                              
                              {/* Entry summary */}
                              {turnover.entries && turnover.entries.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-2">
                                  {['rfc', 'inc', 'alert', 'mim', 'email_slack', 'fyi'].map((type) => {
                                    const count = turnover.entries.filter((entry: any) => entry.entryType === type).length
                                    return (
                                      <div key={type} className="text-center p-2 bg-gray-50 rounded text-xs">
                                        <div className="font-bold">{count}</div>
                                        <div className="text-gray-600 capitalize">{type.replace('_', ' ')}</div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No turnover data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Snapshots Found</h3>
                  <p className="text-gray-600 mb-6">
                    No historical snapshots found for the selected filters.
                  </p>
                  <Button onClick={handleCreateSnapshot}>
                    <Clock className="h-4 w-4 mr-2" />
                    Create First Snapshot
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
    </div>
  )
}
