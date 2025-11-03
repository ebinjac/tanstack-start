import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  Building,
  Layers,
  ChevronDown,
  ChevronRight,
  FolderOpen
} from 'lucide-react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  serverGetSubApplications, 
  serverCreateSubApplication, 
  serverUpdateSubApplication, 
  serverDeleteSubApplication 
} from '@/lib/server/sub-applications'
import { getTeamApplications } from '@/lib/server/applications'
import { TohubSidebar, TohubSidebarMobileButton } from '@/components/layout/tohub-sidebar'

export const Route = createFileRoute('/team/$teamId/tohub/sub-applications')({
  component: SubApplicationsPage,
})

function SubApplicationsPage() {
  const { teamId } = Route.useParams()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSubApp, setSelectedSubApp] = useState<any>(null)
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set())
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  type FormData = {
    applicationId: string
    subApplicationName: string
    code: string
    description: string
    status: 'active' | 'inactive' | 'archived'
  }
  
  const [formData, setFormData] = useState<FormData>({
    applicationId: '',
    subApplicationName: '',
    code: '',
    description: '',
    status: 'active'
  })

  const queryClient = useQueryClient()

  // Fetch team applications
  const { data: applicationsData } = useSuspenseQuery({
    queryKey: ['team-applications', teamId],
    queryFn: () => getTeamApplications({ data: teamId }),
  })

  // Fetch sub-applications for each application
  const { data: subApplicationsData } = useSuspenseQuery({
    queryKey: ['sub-applications', teamId],
    queryFn: async () => {
      if (!applicationsData?.data || applicationsData.data.length === 0) {
        return { success: true, data: [] }
      }

      const allSubApps = []
      for (const app of applicationsData.data) {
        const subAppsResult = await serverGetSubApplications({ data: { applicationId: app.id } })
        if (subAppsResult.success && subAppsResult.data) {
          allSubApps.push(...subAppsResult.data.map(subApp => ({
            ...subApp,
            applicationName: app.applicationName,
            applicationTla: app.tla,
            applicationId: app.id
          })))
        }
      }
      return { success: true, data: allSubApps }
    },
  })

  // Group sub-applications by application
  const groupedSubApps = subApplicationsData?.data?.reduce((acc: any, subApp: any) => {
    if (!acc[subApp.applicationId]) {
      acc[subApp.applicationId] = {
        applicationName: subApp.applicationName,
        applicationTla: subApp.applicationTla,
        subApplications: []
      }
    }
    acc[subApp.applicationId].subApplications.push(subApp)
    return acc
  }, {}) || {}

  // Create sub-application mutation
  const createSubAppMutation = useMutation({
    mutationFn: serverCreateSubApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-applications', teamId] })
      setIsCreateDialogOpen(false)
      resetForm()
    },
  })

  // Update sub-application mutation
  const updateSubAppMutation = useMutation({
    mutationFn: serverUpdateSubApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-applications', teamId] })
      setIsEditDialogOpen(false)
      setSelectedSubApp(null)
      resetForm()
    },
  })

  // Delete sub-application mutation
  const deleteSubAppMutation = useMutation({
    mutationFn: serverDeleteSubApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-applications', teamId] })
    },
  })

  const resetForm = () => {
    setFormData({
      applicationId: '',
      subApplicationName: '',
      code: '',
      description: '',
      status: 'active'
    })
  }

  const handleCreate = () => {
    if (!formData.applicationId || !formData.subApplicationName) {
      return
    }
    createSubAppMutation.mutate({ data: formData })
  }

  const handleEdit = (subApp: any) => {
    setSelectedSubApp(subApp)
    setFormData({
      applicationId: subApp.applicationId,
      subApplicationName: subApp.subApplicationName,
      code: subApp.code || '',
      description: subApp.description || '',
      status: subApp.status as 'active' | 'inactive' | 'archived'
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = () => {
    if (!selectedSubApp || !formData.subApplicationName) {
      return
    }
    updateSubAppMutation.mutate({
      data: {
        id: selectedSubApp.id,
        subApplicationName: formData.subApplicationName,
        code: formData.code,
        description: formData.description,
        status: formData.status
      }
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this sub-application?')) {
      deleteSubAppMutation.mutate({ data: { id } })
    }
  }

  const toggleAppExpansion = (appId: string) => {
    const newExpanded = new Set(expandedApps)
    if (newExpanded.has(appId)) {
      newExpanded.delete(appId)
    } else {
      newExpanded.add(appId)
    }
    setExpandedApps(newExpanded)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'archived':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <TohubSidebar 
        teamId={teamId} 
        isMobileOpen={isMobileOpen} 
        onMobileOpenChange={setIsMobileOpen} 
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
          {/* Mobile menu button */}
          <div className="lg:hidden mb-4">
            <TohubSidebarMobileButton onClick={() => setIsMobileOpen(true)} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Sub-Applications Management</h1>
                <p className="text-muted-foreground">
                  Manage sub-applications under your team's applications
                </p>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sub-Application
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Sub-Application</DialogTitle>
                    <DialogDescription>
                      Add a new sub-application under an existing application.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="application">Application</Label>
                      <Select
                        value={formData.applicationId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, applicationId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an application" />
                        </SelectTrigger>
                        <SelectContent>
                          {applicationsData?.data?.map((app: any) => (
                            <SelectItem key={app.id} value={app.id}>
                              {app.applicationName} ({app.tla})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="subApplicationName">Sub-Application Name</Label>
                      <Input
                        id="subApplicationName"
                        value={formData.subApplicationName}
                        onChange={(e) => setFormData(prev => ({ ...prev, subApplicationName: e.target.value }))}
                        placeholder="Enter sub-application name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="code">Code (Optional)</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="Enter short code (max 12 chars)"
                        maxLength={12}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter description"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleCreate}
                      disabled={createSubAppMutation.isPending}
                    >
                      {createSubAppMutation.isPending ? 'Creating...' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {(!applicationsData?.data || applicationsData.data.length === 0) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No applications found. Please add applications first before creating sub-applications.
                </AlertDescription>
              </Alert>
            )}

            {/* Grouped Applications */}
            {Object.keys(groupedSubApps).length > 0 ? (
              <div className="grid gap-4">
                {Object.entries(groupedSubApps).map(([appId, appData]: [string, any]) => (
                  <motion.div
                    key={appId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card>
                      <CardHeader 
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleAppExpansion(appId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Building className="h-5 w-5 text-muted-foreground" />
                              <span className="font-semibold text-lg">{appData.applicationName}</span>
                              <Badge variant="outline">{appData.applicationTla}</Badge>
                            </div>
                            <Badge variant="secondary" className="ml-2">
                              {appData.subApplications.length} sub-applications
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {expandedApps.has(appId) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      {expandedApps.has(appId) && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {appData.subApplications.map((subApp: any) => (
                              <motion.div
                                key={subApp.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border rounded-lg p-4 bg-gray-50"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Layers className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">{subApp.subApplicationName}</span>
                                      <Badge variant={getStatusBadgeVariant(subApp.status)}>
                                        {subApp.status}
                                      </Badge>
                                    </div>
                                    {subApp.code && (
                                      <p className="text-sm text-muted-foreground mb-1">Code: {subApp.code}</p>
                                    )}
                                    {subApp.description && (
                                      <p className="text-sm text-muted-foreground mb-2">{subApp.description}</p>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                      Created: {new Date(subApp.createdAt).toLocaleDateString()}
                                      {subApp.updatedAt && (
                                        <span> • Updated: {new Date(subApp.updatedAt).toLocaleDateString()}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(subApp)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(subApp.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Sub-Applications Found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Get started by creating your first sub-application under an existing application.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Sub-Application
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Sub-Application</DialogTitle>
            <DialogDescription>
              Update sub-application details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-subApplicationName">Sub-Application Name</Label>
              <Input
                id="edit-subApplicationName"
                value={formData.subApplicationName}
                onChange={(e) => setFormData(prev => ({ ...prev, subApplicationName: e.target.value }))}
                placeholder="Enter sub-application name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Code (Optional)</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Enter short code (max 12 chars)"
                maxLength={12}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') => setFormData(prev => ({ ...prev, status: value }))}
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
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleUpdate}
              disabled={updateSubAppMutation.isPending}
            >
              {updateSubAppMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
