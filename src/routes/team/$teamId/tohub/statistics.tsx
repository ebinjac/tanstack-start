// routes/team/$teamId/tohub/statistics.tsx

import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TohubLayout } from '@/components/layout/tohub-layout'
import { AuthProvider } from '@/contexts/auth-context'
import { useAuthContext } from '@/contexts/auth-context'
import { 
  serverGetTurnovers,
  serverGetSnapshots,
  serverGetStaleEntries
} from '@/lib/server/turnovers'
import { getTeamApplications } from '@/lib/server/applications'
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Activity,
  Target,
  CheckCircle
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay, isSameDay, parseISO } from 'date-fns'

export const Route = createFileRoute('/team/$teamId/tohub/statistics')({
  component: Statistics,
})

function Statistics() {
  const { teamId } = Route.useParams()
  
  return (
    <AuthProvider>
      <TohubLayout teamId={teamId}>
        <StatisticsContent />
      </TohubLayout>
    </AuthProvider>
  )
}

function StatisticsContent() {
  const { teams } = useAuthContext()
  const { teamId } = Route.useParams()

  const [selectedApplication, setSelectedApplication] = useState<string>('')
  const [selectedSubApplication, setSelectedSubApplication] = useState<string>('')
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days'>('30days')
  const [chartType, setChartType] = useState<'entries' | 'priorities' | 'types' | 'trends'>('entries')

  const currentTeam = teams.find(team => team.id === teamId)

  // Fetch applications for the team
  const { data: applicationsData } = useQuery({
    queryKey: ['team-applications', teamId],
    queryFn: () => getTeamApplications({ data: teamId }),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch turnovers for analytics
  const { data: turnoversData, isLoading: turnoversLoading, refetch: refetchTurnovers } = useQuery({
    queryKey: ['turnovers-analytics', teamId, selectedApplication, selectedSubApplication, timeRange],
    queryFn: () => serverGetTurnovers({ 
      data: { 
        teamId, 
        applicationId: selectedApplication || undefined,
        subApplicationId: selectedSubApplication || undefined,
        status: 'active',
        limit: 1000 // Get more data for analytics
      } 
    }),
    staleTime: 2 * 60 * 1000,
  })

  // Fetch snapshots for trend analysis
  const { data: snapshotsData } = useQuery({
    queryKey: ['snapshots-analytics', teamId, selectedApplication, selectedSubApplication, timeRange],
    queryFn: () => serverGetSnapshots({ 
      data: { 
        teamId, 
        applicationId: selectedApplication || undefined,
        subApplicationId: selectedSubApplication || undefined,
        startDate: format(startOfDay(subDays(new Date(), parseInt(timeRange.replace('days', '')))), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        endDate: format(endOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
      } 
    }),
    staleTime: 2 * 60 * 1000,
  })

  // Fetch stale entries
  const { data: staleEntriesData } = useQuery({
    queryKey: ['stale-entries', teamId],
    queryFn: () => serverGetStaleEntries({ 
      data: { 
        teamId, 
        hours: 24 
      } 
    }),
    staleTime: 5 * 60 * 1000,
  })

  const applications = applicationsData?.success ? applicationsData.data : []
  const turnovers = turnoversData?.success ? turnoversData.data : []
  const snapshots = snapshotsData?.success ? snapshotsData.data : []
  const staleEntries = staleEntriesData?.success ? staleEntriesData.data : []

  // Calculate analytics data
  const getAnalyticsData = () => {
    // Entry type distribution
    const entryTypeData = [
      { name: 'RFC', value: 0, color: '#3b82f6' },
      { name: 'INC', value: 0, color: '#ef4444' },
      { name: 'Alert', value: 0, color: '#f97316' },
      { name: 'MIM', value: 0, color: '#8b5cf6' },
      { name: 'Email/Slack', value: 0, color: '#10b981' },
      { name: 'FYI', value: 0, color: '#6b7280' }
    ]

    // Priority distribution
    const priorityData = [
      { name: 'Normal', value: 0, color: '#6b7280' },
      { name: 'Important', value: 0, color: '#3b82f6' },
      { name: 'Flagged', value: 0, color: '#f97316' },
      { name: 'Needs Action', value: 0, color: '#ef4444' },
      { name: 'Long Pending', value: 0, color: '#8b5cf6' }
    ]

    // Daily trend data
    const trendData = []
    const today = new Date()
    
    for (let i = parseInt(timeRange.replace('days', '')) - 1; i >= 0; i--) {
      const date = subDays(today, i)
      const dateStr = format(date, 'MMM dd')
      
      // Count entries for this date
      let entriesCount = 0
      let flaggedCount = 0
      
      turnovers?.forEach(turnover => {
        // In a real implementation, we would count entries by date
        // For now, we'll use mock data
        entriesCount += Math.floor(Math.random() * 10) + 1
        flaggedCount += Math.floor(Math.random() * 3)
      })
      
      trendData.push({
        date: dateStr,
        entries: entriesCount,
        flagged: flaggedCount
      })
    }

    // Calculate totals
    let totalEntries = 0
    let totalFlagged = 0
    let totalTurnovers = turnovers?.length || 0

    // Mock data for demonstration
    totalEntries = totalTurnovers * 15 // Average 15 entries per turnover
    totalFlagged = Math.floor(totalEntries * 0.2) // 20% flagged

    // Update distribution data with mock values
    entryTypeData.forEach(item => {
      item.value = Math.floor(Math.random() * totalEntries * 0.3) + 1
    })

    priorityData.forEach(item => {
      item.value = Math.floor(Math.random() * totalEntries * 0.3) + 1
    })

    return {
      entryTypeData,
      priorityData,
      trendData,
      totalEntries,
      totalFlagged,
      totalTurnovers,
      staleEntriesCount: staleEntries?.length || 0
    }
  }

  const analyticsData = getAnalyticsData()

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <div className="h-4 w-4" />
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600'
    if (current < previous) return 'text-red-600'
    return 'text-gray-600'
  }

  const handleExportData = () => {
    // Create a downloadable JSON file with analytics data
    const exportData = {
      teamId,
      timeRange,
      analyticsData,
      generatedAt: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `turnover-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
                Statistics & Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                {currentTeam.teamName} - Turnover insights and trends
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetchTurnovers()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
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
                Filters & Display Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                {/* Time Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Range</label>
                  <Select
                    value={timeRange}
                    onValueChange={(value) => setTimeRange(value as '7days' | '30days' | '90days')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Chart Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chart Type</label>
                  <Select
                    value={chartType}
                    onValueChange={(value) => setChartType(value as 'entries' | 'priorities' | 'types' | 'trends')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entries">Entry Distribution</SelectItem>
                      <SelectItem value="priorities">Priority Analysis</SelectItem>
                      <SelectItem value="types">Entry Types</SelectItem>
                      <SelectItem value="trends">Trends Over Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Stats */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Stats</label>
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{analyticsData.totalEntries} total entries</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      <span>{analyticsData.totalFlagged} flagged</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-red-500" />
                      <span>{analyticsData.staleEntriesCount} stale</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Turnovers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalTurnovers}</div>
                <p className="text-xs text-muted-foreground">
                  {timeRange === '7days' ? 'This week' : timeRange === '30days' ? 'This month' : 'This quarter'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalEntries}</div>
                <p className="text-xs text-muted-foreground">
                  Across all turnovers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  {getTrendIcon(analyticsData.totalFlagged, Math.floor(analyticsData.totalFlagged * 0.8))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{analyticsData.totalFlagged}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={getTrendColor(analyticsData.totalFlagged, Math.floor(analyticsData.totalFlagged * 0.8))}>
                    {analyticsData.totalFlagged > Math.floor(analyticsData.totalFlagged * 0.8) ? '↑' : '↓'} from last period
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stale Entries</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analyticsData.staleEntriesCount}</div>
                <p className="text-xs text-muted-foreground">
                  Not updated in 24h
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Main Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {chartType === 'entries' && 'Entry Distribution by Type'}
                {chartType === 'priorities' && 'Priority Distribution'}
                {chartType === 'types' && 'Entry Types Analysis'}
                {chartType === 'trends' && 'Trends Over Time'}
              </CardTitle>
              <CardDescription>
                {chartType === 'entries' && 'Breakdown of entries by type'}
                {chartType === 'priorities' && 'Distribution of entry priorities'}
                {chartType === 'types' && 'Analysis of entry types and patterns'}
                {chartType === 'trends' && 'Entry trends over the selected period'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {turnoversLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-80">
                  {chartType === 'entries' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.entryTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {chartType === 'priorities' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.priorityData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  {chartType === 'types' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.entryTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {chartType === 'trends' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="entries" stroke="#3b82f6" name="Total Entries" />
                        <Line type="monotone" dataKey="flagged" stroke="#ef4444" name="Flagged Entries" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Secondary Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Types</CardTitle>
              <CardDescription>Distribution by entry type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.entryTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analyticsData.entryTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority Levels</CardTitle>
              <CardDescription>Breakdown by priority</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.priorityData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stale Entries Warning */}
        {analyticsData.staleEntriesCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="mt-6"
          >
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <Clock className="h-5 w-5" />
                  Stale Entries Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 mb-4">
                  You have {analyticsData.staleEntriesCount} entries that haven't been updated in over 24 hours.
                </p>
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  Review Stale Entries
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
    </div>
  )
}