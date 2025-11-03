// routes/team/$teamId/applications/manage.tsx

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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MainHeader } from '@/components/layout/main-header'
import { AuthProvider } from '@/contexts/auth-context'
import { useAuthContext } from '@/contexts/auth-context'
import { 
  getTeamApplications,
  createApplication,
  updateApplication,
  deleteApplication
} from '@/lib/server/applications'
import { 
  serverGetSubApplications,
  serverCreateSubApplication,
  serverUpdateSubApplication,
  serverDeleteSubApplication
} from '@/lib/server/sub-applications'
import { 
  Plus,
  Edit,
  Trash2,
  Settings,
  FolderOpen,
  Folder,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Search,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/team/$teamId/applications/manage')({
  component: ManageApplications,
})

function ManageApplications() {
  return (
    <AuthProvider>
      <ManageApplicationsContent />
    </AuthProvider>
  )
}

function ManageApplicationsContent() {
  const { teams } = useAuthContext()
  const { teamId } = Route.useParams()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'applications' | 'sub-applications'>('applications')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAppDialogOpen, setIsAppDialogOpen] = useState(false)
  const [isSubAppDialogOpen, setIsSubAppDialogOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<any>(null)
  const [editingSubApp, setEditingSubApp] = useState<any>(null)
  const [selectedAppId, setSelectedAppId] = useState<string>('')

  const currentTeam = teams.find(team => team.id === teamId)

  // Fetch applications for the team
  const { data: applicationsData, isLoading: applicationsLoading, refetch: refetchApplications } = useQuery({
    queryKey: ['team-applications', teamId],
    queryFn: () => getTeamApplications({ data: teamId }),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch sub-applications for selected application
  const { data: subApplicationsData, isLoading: subApplicationsLoading, refetch: refetchSubApplications } = useQuery({
    queryKey: ['sub-applications', selectedAppId],
    queryFn: () => selectedAppId ? serverGetSubApplications({ data: { applicationId: selectedAppId } }) : null,
    enabled: !!selectedAppId,
    staleTime: 5 * 60 * 1000,
  })

  // Mutations for applications
  const createAppMutation = useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-applications'] })
      setIsAppDialogOpen(false)
      setEditingApp(null)
    },
  })

  const updateAppMutation = useMutation({
    mutationFn: updateApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-applications'] })
      setIsAppDialogOpen(false)
      setEditingApp(null)
    },
  })

  const deleteAppMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-applications'] })
      queryClient.invalidateQueries({ queryKey: ['sub-applications'] })
    },
  })

  // Mutations for sub-applications
  const createSubAppMutation = useMutation({
    mutationFn: serverCreateSubApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-applications'] })
      setIsSubAppDialogOpen(false)
      setEditingSubApp(null)
    },
  })

  const updateSubAppMutation = useMutation({
    mutationFn: serverUpdateSubApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-applications'] })
      setIsSubAppDialogOpen(false)
      setEditingSubApp(null)
    },
  })

  const deleteSubAppMutation = useMutation({
    mutationFn: serverDeleteSubApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-applications'] })
    },
  })

  const applications = applicationsData?.success ? applicationsData.data : []
  const subApplications = subApplicationsData?.success ? subApplicationsData.data : []

  // Filter applications based on search term
  const filteredApplications = applications?.filter(app =>
    app.applicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.tla.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Filter sub-applications based on search term
  const filteredSubApplications = subApplications?.filter(sub =>
    sub.subApplicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleAddApplication = () => {
    setEditingApp(null)
    setIsAppDialogOpen(true)
  }

  const handleEditApplication = (app: any) => {
    setEditingApp(app)
    setIsAppDialogOpen(true)
  }

  const handleDeleteApplication = (id: string) => {
    if (confirm('Are you sure you want to delete this application? This will also delete all associated sub-applications and turnovers.')) {
      deleteAppMutation.mutate(id)
    }
  }

  const handleSaveApplication = (appData: any) => {
    try {
      if (editingApp) {
        // Update existing application
        updateAppMutation.mutate({
          id: editingApp.id,
          ...appData
        })
      } else {
        // Create new application
        createAppMutation.mutate({
          teamId,
          ...appData
        })
      }
    } catch (error) {
      console.error('Error saving application:', error)
    }
  }

  const handleAddSubApplication = () => {
    if (!selectedAppId) {
      alert('Please select an application first')
      return
    }
    setEditingSubApp(null)
    setIsSubAppDialogOpen(true)
  }

  const handleEditSubApplication = (sub: any) => {
    setEditingSubApp(sub)
    setIsSubAppDialogOpen(true)
  }

  const handleDeleteSubApplication = (id: string) => {
    if (confirm('Are you sure you want to delete this sub-application? This will also delete all associated turnovers.')) {
      deleteSubAppMutation.mutate({ data: { id } })
    }
  }

  const handleSaveSubApplication = (subData: any) => {
    try {
      if (editingSubApp) {
        // Update existing sub-application
        updateSubAppMutation.mutate({
          id: editingSubApp.id,
          ...subData
        })
      } else {
        // Create new sub-application
        createSubAppMutation.mutate({
          data: {
            applicationId: selectedAppId,
            ...subData
          }
        })
      }
    } catch (error) {
      console.error('Error saving sub-application:', error)
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />

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
                Application Management
              </h1>
              <p className="text-gray-600 mt-1">
                {currentTeam.teamName} - Manage applications and sub-applications
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => {
                refetchApplications()
                refetchSubApplications()
              }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter */}
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
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search applications or sub-applications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeTab === 'applications' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('applications')}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    Applications
                  </Button>
                  <Button
                    variant={activeTab === 'sub-applications' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('sub-applications')}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Sub-Applications
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    Applications
                  </CardTitle>
                  <Button onClick={handleAddApplication}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Application
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm ? 'No applications match your search criteria.' : 'Get started by adding your first application.'}
                    </p>
                    <Button onClick={handleAddApplication}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Application
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>TLA</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>VP</TableHead>
                          <TableHead>Sub-Applications</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications.map((app: any) => (
                          <TableRow key={app.id}>
                            <TableCell className="font-medium">{app.applicationName}</TableCell>
                            <TableCell>{app.tla}</TableCell>
                            <TableCell>
                              <Badge variant={app.lifeCycleStatus === 'active' ? 'default' : 'secondary'}>
                                {app.lifeCycleStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>{app.tier}</TableCell>
                            <TableCell>{app.vpName}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAppId(app.id)
                                  setActiveTab('sub-applications')
                                }}
                                className="h-8 px-2"
                              >
                                {subApplications?.filter(sub => sub.id === app.id).length || 0}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditApplication(app)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteApplication(app.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Sub-Applications Tab */}
        {activeTab === 'sub-applications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      Sub-Applications
                    </CardTitle>
                    {selectedAppId && (
                      <CardDescription>
                        Showing sub-applications for: {applications?.find(app => app.id === selectedAppId)?.applicationName}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedAppId}
                      onValueChange={setSelectedAppId}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select Application" />
                      </SelectTrigger>
                      <SelectContent>
                        {applications?.map((app: any) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.applicationName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddSubApplication} disabled={!selectedAppId}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Sub-Application
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedAppId ? (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Application</h3>
                    <p className="text-gray-600">
                      Please select an application to view and manage its sub-applications.
                    </p>
                  </div>
                ) : subApplicationsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredSubApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sub-Applications Found</h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm ? 'No sub-applications match your search criteria.' : 'Get started by adding your first sub-application.'}
                    </p>
                    <Button onClick={handleAddSubApplication}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Sub-Application
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubApplications.map((sub: any) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.subApplicationName}</TableCell>
                            <TableCell>{sub.code}</TableCell>
                            <TableCell>
                              <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                {sub.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{sub.description}</TableCell>
                            <TableCell>{format(new Date(sub.createdAt), 'PPP')}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSubApplication(sub)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSubApplication(sub.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Application Dialog */}
        <AppDialog
          isOpen={isAppDialogOpen}
          onClose={() => setIsAppDialogOpen(false)}
          application={editingApp}
          onSave={handleSaveApplication}
        />

        {/* Sub-Application Dialog */}
        <SubAppDialog
          isOpen={isSubAppDialogOpen}
          onClose={() => setIsSubAppDialogOpen(false)}
          subApplication={editingSubApp}
          onSave={handleSaveSubApplication}
        />
      </div>
    </div>
  )
}

// Application Dialog Component
interface AppDialogProps {
  isOpen: boolean
  onClose: () => void
  application?: any
  onSave: (data: any) => void
}

function AppDialog({ isOpen, onClose, application, onSave }: AppDialogProps) {
  const [formData, setFormData] = useState({
    applicationName: '',
    tla: '',
    lifeCycleStatus: 'active',
    tier: '',
    vpName: '',
    vpEmail: '',
    description: ''
  })

  useEffect(() => {
    if (application) {
      setFormData({
        applicationName: application.applicationName || '',
        tla: application.tla || '',
        lifeCycleStatus: application.lifeCycleStatus || 'active',
        tier: application.tier || '',
        vpName: application.vpName || '',
        vpEmail: application.vpEmail || '',
        description: application.description || ''
      })
    } else {
      setFormData({
        applicationName: '',
        tla: '',
        lifeCycleStatus: 'active',
        tier: '',
        vpName: '',
        vpEmail: '',
        description: ''
      })
    }
  }, [application])

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {application ? 'Edit Application' : 'Add Application'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicationName">Application Name</Label>
              <Input
                id="applicationName"
                value={formData.applicationName}
                onChange={(e) => setFormData(prev => ({ ...prev, applicationName: e.target.value }))}
                placeholder="Enter application name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tla">Three Letter Acronym (TLA)</Label>
              <Input
                id="tla"
                value={formData.tla}
                onChange={(e) => setFormData(prev => ({ ...prev, tla: e.target.value }))}
                placeholder="Enter TLA"
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lifeCycleStatus">Lifecycle Status</Label>
              <Select
                value={formData.lifeCycleStatus}
                onValueChange={(value) => setFormData(prev => ({ ...prev, lifeCycleStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Tier</Label>
              <Select
                value={formData.tier}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tier: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tier 1</SelectItem>
                  <SelectItem value="2">Tier 2</SelectItem>
                  <SelectItem value="3">Tier 3</SelectItem>
                  <SelectItem value="4">Tier 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vpName">VP Name</Label>
              <Input
                id="vpName"
                value={formData.vpName}
                onChange={(e) => setFormData(prev => ({ ...prev, vpName: e.target.value }))}
                placeholder="Enter VP name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vpEmail">VP Email</Label>
              <Input
                id="vpEmail"
                type="email"
                value={formData.vpEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, vpEmail: e.target.value }))}
                placeholder="Enter VP email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter application description"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {application ? 'Update' : 'Add'} Application
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Sub-Application Dialog Component
interface SubAppDialogProps {
  isOpen: boolean
  onClose: () => void
  subApplication?: any
  onSave: (data: any) => void
}

function SubAppDialog({ isOpen, onClose, subApplication, onSave }: SubAppDialogProps) {
  const [formData, setFormData] = useState({
    subApplicationName: '',
    code: '',
    status: 'active',
    description: ''
  })

  useEffect(() => {
    if (subApplication) {
      setFormData({
        subApplicationName: subApplication.subApplicationName || '',
        code: subApplication.code || '',
        status: subApplication.status || 'active',
        description: subApplication.description || ''
      })
    } else {
      setFormData({
        subApplicationName: '',
        code: '',
        status: 'active',
        description: ''
      })
    }
  }, [subApplication])

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {subApplication ? 'Edit Sub-Application' : 'Add Sub-Application'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subApplicationName">Sub-Application Name</Label>
              <Input
                id="subApplicationName"
                value={formData.subApplicationName}
                onChange={(e) => setFormData(prev => ({ ...prev, subApplicationName: e.target.value }))}
                placeholder="Enter sub-application name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Enter code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter sub-application description"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {subApplication ? 'Update' : 'Add'} Sub-Application
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
