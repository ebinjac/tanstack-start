import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Suspense } from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { MainHeader } from '@/components/layout/main-header'
import { useAuthContext } from '@/contexts/auth-context'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  Plus,
  Download
} from 'lucide-react'

export const Route = createFileRoute('/team/$teamId/scorecard')({
  component: TeamScorecard,
})

function TeamScorecard() {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <TeamScorecardContent />
      </Suspense>
    </AuthProvider>
  )
}

function TeamScorecardContent() {
  const { teams } = useAuthContext()
  const { teamId } = Route.useParams()

  const currentTeam = teams.find(team => team.id === teamId)

  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Not Found</h1>
            <p className="text-gray-600">The team you're looking for doesn't exist or you don't have access.</p>
          </div>
        </div>
      </div>
    )
  }

  // Mock metrics data
  const metrics = [
    {
      id: 1,
      name: 'System Uptime',
      value: 99.9,
      target: 99.5,
      unit: '%',
      trend: 'up',
      status: 'good',
      description: 'Overall system availability'
    },
    {
      id: 2,
      name: 'Incident Response Time',
      value: 15,
      target: 30,
      unit: 'min',
      trend: 'down',
      status: 'good',
      description: 'Average time to respond to incidents'
    },
    {
      id: 3,
      name: 'Deployment Success Rate',
      value: 97,
      target: 95,
      unit: '%',
      trend: 'up',
      status: 'good',
      description: 'Successful deployments vs total attempts'
    },
    {
      id: 4,
      name: 'Customer Satisfaction',
      value: 4.6,
      target: 4.5,
      unit: '/5',
      trend: 'stable',
      status: 'good',
      description: 'Average customer satisfaction score'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good': return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>
      case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case 'critical': return <Badge variant="destructive">Critical</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />

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
                {currentTeam.teamName} Scorecard
              </h1>
              <p className="text-gray-600 mt-1">Monitor team performance and metrics</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Metric
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">92%</div>
                <p className="text-lg text-gray-600 mb-4">Overall Performance Score</p>
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">+3% from last month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="history">Historical Data</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-6">
            {/* Metrics Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{metric.name}</CardTitle>
                        {getStatusBadge(metric.status)}
                      </div>
                      <CardDescription>{metric.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold">
                            {metric.value}{metric.unit}
                          </div>
                          <div className={`flex items-center gap-1 ${getStatusColor(metric.status)}`}>
                            {metric.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                            {metric.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                            {metric.trend === 'stable' && <Activity className="h-4 w-4" />}
                            <span className="text-sm font-medium">
                              {metric.trend === 'up' ? 'Improving' : metric.trend === 'down' ? 'Declining' : 'Stable'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress towards target</span>
                            <span className="font-medium">
                              {metric.value}{metric.unit} / {metric.target}{metric.unit}
                            </span>
                          </div>
                          <Progress
                            value={(metric.value / metric.target) * 100}
                            className="h-2"
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Target: {metric.target}{metric.unit}</span>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span className="text-green-600">
                              {metric.value >= metric.target ? 'On Target' : `${((metric.value / metric.target) * 100).toFixed(0)}% to target`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Track your metrics over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Trend charts will be displayed here</p>
                      <p className="text-sm text-gray-400">Integration with charting library needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Historical Data</CardTitle>
                  <CardDescription>View historical performance data and reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-500">
                      <AlertTriangle className="h-4 w-4 inline mr-2" />
                      Historical data tracking will be implemented with time-series database integration
                    </div>
                    <Button variant="outline" className="w-full">
                      Enable Historical Tracking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}