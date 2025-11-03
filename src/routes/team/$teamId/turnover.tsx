import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Suspense } from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { MainHeader } from '@/components/layout/main-header'
import { useAuthContext } from '@/contexts/auth-context'
import { useState } from 'react'
import {
  Users,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  MessageSquare,
  FileText,
  TrendingUp,
  Bell
} from 'lucide-react'

export const Route = createFileRoute('/team/$teamId/turnover')({
  component: TeamTurnover,
})

function TeamTurnover() {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <TeamTurnoverContent />
      </Suspense>
    </AuthProvider>
  )
}

function TeamTurnoverContent() {
  const { teams } = useAuthContext()
  const { teamId } = Route.useParams()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

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

  // Mock turnover data
  const turnovers = [
    {
      id: 1,
      fromUser: 'Alice Johnson',
      toUser: 'Bob Smith',
      shift: 'Morning',
      date: '2024-01-15',
      status: 'completed',
      handoverNotes: 'All systems operational. No ongoing incidents.',
      priority: 'normal'
    },
    {
      id: 2,
      fromUser: 'Bob Smith',
      toUser: 'Carol White',
      shift: 'Afternoon',
      date: '2024-01-15',
      status: 'pending',
      handoverNotes: 'Investigating minor API latency issues.',
      priority: 'high'
    },
    {
      id: 3,
      fromUser: 'Carol White',
      toUser: 'David Brown',
      shift: 'Evening',
      date: '2024-01-14',
      status: 'completed',
      handoverNotes: 'Database maintenance completed. All services restored.',
      priority: 'low'
    }
  ]

  const teamMembers = [
    { id: 1, name: 'Alice Johnson', role: 'Senior Engineer' },
    { id: 2, name: 'Bob Smith', role: 'DevOps Engineer' },
    { id: 3, name: 'Carol White', role: 'Site Reliability Engineer' },
    { id: 4, name: 'David Brown', role: 'Junior Engineer' }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending': return <Badge variant="secondary">Pending</Badge>
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High Priority</Badge>
      case 'medium': return <Badge variant="secondary">Medium</Badge>
      case 'low': return <Badge variant="outline">Low</Badge>
      default: return <Badge>Normal</Badge>
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
                {currentTeam.teamName} Turnover
              </h1>
              <p className="text-gray-600 mt-1">Manage shift handovers and team transitions</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Turnover
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule New Turnover</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromUser">From User</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select from user" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toUser">To User</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select to user" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shift">Shift</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (6AM - 2PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (2PM - 10PM)</SelectItem>
                          <SelectItem value="evening">Evening (10PM - 6AM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Handover Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Enter handover notes, ongoing incidents, or important information..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(false)}>
                    Schedule Turnover
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="team">Team Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Turnovers</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">
                    1 due today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    All on time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4</div>
                  <p className="text-xs text-muted-foreground">
                    2 on duty
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Turnovers List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="space-y-4"
            >
              {turnovers.map((turnover, index) => (
                <motion.div
                  key={turnover.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <User className="h-4 w-4 text-gray-600" />
                              <span className="font-medium">{turnover.fromUser}</span>
                            </div>
                            <div className="text-gray-400">→</div>
                            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{turnover.toUser}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(turnover.priority)}
                          {getStatusBadge(turnover.status)}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {turnover.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {turnover.shift}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium">Handover Notes</span>
                          </div>
                          <p className="text-sm text-gray-700">{turnover.handoverNotes}</p>
                        </div>

                        {turnover.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete
                            </Button>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
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
                  <CardTitle>Turnover History</CardTitle>
                  <CardDescription>Historical shift handovers and completed turnovers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Historical turnover data will appear here</p>
                    <Button variant="outline">
                      Load History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Team Schedule</CardTitle>
                  <CardDescription>View team member availability and shift schedules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamMembers.map((member) => (
                      <motion.div
                        key={member.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{member.name}</h3>
                            <p className="text-sm text-gray-500">{member.role}</p>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span>Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>Next shift: Tomorrow</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
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