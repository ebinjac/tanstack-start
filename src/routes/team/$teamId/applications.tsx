import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useAuthContext } from '@/contexts/auth-context'
import { Link } from '@tanstack/react-router'
import { MainHeader } from '@/components/layout/main-header'
import {
  ArrowLeft,
  Building2,
  Users,
  Plus,
  Search,
  Settings,
  Trash2,
  RefreshCw,
  ExternalLink,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Globe,
  Layers,
  Database,
  Edit,
  User,
  Briefcase,
  Phone,
  Calendar,
  LayoutDashboard,
  Package,
  CreditCard,
  Webhook,
  Keyboard,
  Monitor,
  Smartphone,
  HelpCircle,
  FileText
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'

const AddApplicationSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  tla: z.string().min(1, 'TLA is required').max(12, 'TLA must be 12 characters or less'),
  escalationEmail: z.string().email().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  teamEmail: z.string().email().optional().or(z.literal('')),
  snowGroup: z.string().max(255).optional(),
  slackChannel: z.string().max(100).optional(),
  description: z.string().optional()
})

const UpdateApplicationSchema = z.object({
  id: z.string().uuid(),
  tla: z.string().min(1, 'TLA is required').max(12, 'TLA must be 12 characters or less'),
  escalationEmail: z.string().email().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  teamEmail: z.string().email().optional().or(z.literal('')),
  snowGroup: z.string().max(255).optional(),
  slackChannel: z.string().max(100).optional(),
  description: z.string().optional()
})


export const Route = createFileRoute('/team/$teamId/applications')({
  component: TeamApplications,
})

function TeamApplications() {
  const { teamId } = Route.useParams()
  const { user, teams, hasAccess } = useAuthContext()
  const queryClient = useQueryClient()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tlaAvailability, setTlaAvailability] = useState<{ available: boolean; message: string } | null>(null)
  const [editTlaAvailability, setEditTlaAvailability] = useState<{ available: boolean; message: string } | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingApplication, setViewingApplication] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [applicationToDelete, setApplicationToDelete] = useState<any>(null)

  // Fetch team details
  const { data: teamDetails } = useQuery({
    queryKey: ['team-details', teamId],
    queryFn: async () => {
      const { getTeamDetails } = await import('@/lib/server/applications')
      return getTeamDetails({ data: teamId })
    },
  })

  // Fetch team applications
  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ['team-applications', teamId],
    queryFn: async () => {
      const { getTeamApplications } = await import('@/lib/server/applications')
      return getTeamApplications({ data: teamId })
    },
  })

  // Add application mutation
  const addApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const { addApplicationFromCentralApi } = await import('@/lib/server/applications')
      return addApplicationFromCentralApi({
        data: {
          ...data,
          teamId,
          createdBy: user?.attributes?.email || 'unknown'
        }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-applications', teamId] })
      queryClient.invalidateQueries({ queryKey: ['team-details', teamId] })
      setIsAddDialogOpen(false)
    },
  })

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: async (appId: string) => {
      const { deleteApplication } = await import('@/lib/server/applications')
      return deleteApplication({ data: appId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-applications', teamId] })
      queryClient.invalidateQueries({ queryKey: ['team-details', teamId] })
    },
  })

  // Sync application mutation
  const syncApplicationMutation = useMutation({
    mutationFn: async (appId: string) => {
      const { syncApplicationWithCentralApi } = await import('@/lib/server/applications')
      return syncApplicationWithCentralApi({ data: appId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-applications', teamId] })
    },
  })

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const { updateApplication } = await import('@/lib/server/applications')
      return updateApplication({
        data: {
          ...data,
          updatedBy: user?.attributes?.email || 'unknown'
        }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-applications', teamId] })
      setIsEditDialogOpen(false)
    },
  })

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<any>(null)

  const form = useForm<z.infer<typeof AddApplicationSchema>>({
    resolver: zodResolver(AddApplicationSchema),
    defaultValues: {
      assetId: '',
      tla: '',
      escalationEmail: '',
      contactEmail: '',
      teamEmail: '',
      snowGroup: '',
      slackChannel: '',
      description: ''
    }
  })

  const editForm = useForm<z.infer<typeof UpdateApplicationSchema>>({
    resolver: zodResolver(UpdateApplicationSchema),
    defaultValues: {
      id: '',
      tla: '',
      escalationEmail: '',
      contactEmail: '',
      teamEmail: '',
      snowGroup: '',
      slackChannel: '',
      description: ''
    }
  })

  const onAddApplication = (values: z.infer<typeof AddApplicationSchema>) => {
    addApplicationMutation.mutate(values)
  }

  const onEditApplication = (values: z.infer<typeof UpdateApplicationSchema>) => {
    updateApplicationMutation.mutate(values)
  }

  // Check TLA availability for add form
  const checkTlaAvailability = async (tla: string) => {
    if (!tla || tla.length < 1) {
      setTlaAvailability(null)
      return
    }
    
    try {
      const { checkTlaAvailability } = await import('@/lib/server/applications')
      const result = await checkTlaAvailability({
        data: {
          tla,
          teamId
        }
      })
      
      if (result.success && result.data) {
        setTlaAvailability(result.data)
      } else {
        setTlaAvailability({ available: false, message: 'Failed to check TLA availability' })
      }
    } catch (error) {
      setTlaAvailability({ available: false, message: 'Failed to check TLA availability' })
    }
  }

  // Check TLA availability for edit form
  const checkEditTlaAvailability = async (tla: string, applicationId: string) => {
    if (!tla || tla.length < 1) {
      setEditTlaAvailability(null)
      return
    }
    
    try {
      const { checkTlaAvailability } = await import('@/lib/server/applications')
      const result = await checkTlaAvailability({
        data: {
          tla,
          teamId,
          applicationId
        }
      })
      
      if (result.success && result.data) {
        setEditTlaAvailability(result.data)
      } else {
        setEditTlaAvailability({ available: false, message: 'Failed to check TLA availability' })
      }
    } catch (error) {
      setEditTlaAvailability({ available: false, message: 'Failed to check TLA availability' })
    }
  }

  const openEditDialog = (application: any) => {
    setEditingApplication(application)
    editForm.reset({
      id: application.id,
      tla: application.tla || '',
      escalationEmail: application.escalationEmail || '',
      contactEmail: application.contactEmail || '',
      teamEmail: application.teamEmail || '',
      snowGroup: application.snowGroup || '',
      slackChannel: application.slackChannel || '',
      description: application.description || ''
    })
    setEditTlaAvailability(null) // Reset TLA availability check
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (application: any) => {
    setViewingApplication(application)
    setIsViewDialogOpen(true)
  }

  const openDeleteDialog = (application: any) => {
    setApplicationToDelete(application)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (applicationToDelete) {
      deleteApplicationMutation.mutate(applicationToDelete.id)
      setIsDeleteDialogOpen(false)
      setApplicationToDelete(null)
    }
  }

  const filteredApplications = applicationsData?.data?.filter((app: any) =>
    app.applicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.tla.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const team = teamDetails?.data
  const applications = applicationsData?.data || []
  const currentUserTeam = teams.find(t => t.id === teamId)
  const isAdmin = currentUserTeam?.accessLevel === 'admin' || hasAccess

  const sidebarNavItems = [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          url: `/team/${teamId}/dashboard`,
          icon: LayoutDashboard,
          isActive: false,
        },
        {
          title: "Applications",
          url: `/team/${teamId}/applications`,
          icon: Package,
          isActive: true,
          badge: applications.length > 0 ? applications.length.toString() : undefined,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          title: "Scorecard",
          url: `/team/${teamId}/scorecard`,
          icon: FileText,
          isActive: false,
        },
        {
          title: "Link Manager",
          url: `/team/${teamId}/links`,
          icon: Webhook,
          isActive: false,
        },
        {
          title: "Turnover",
          url: `/team/${teamId}/turnover`,
          icon: Users,
          isActive: false,
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <MainHeader />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full md:w-64 space-y-6"
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your team settings and preferences.
                </p>
              </div>
              <Separator />
            </div>
            
            <nav className="space-y-4">
              {sidebarNavItems.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.title}
                        to={item.url}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          item.isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </motion.aside>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex-1 space-y-6"
          >
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
                <p className="text-muted-foreground">
                  Manage your team's applications and their configurations.
                </p>
              </div>
              {isAdmin && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Application
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Application</DialogTitle>
                      <DialogDescription>
                        Enter the asset ID to fetch application details from Central API
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onAddApplication)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="assetId">Asset ID *</Label>
                          <Input
                            id="assetId"
                            type="text"
                            placeholder="200004789"
                            {...form.register('assetId')}
                          />
                          {form.formState.errors.assetId && (
                            <p className="text-sm text-red-500">{form.formState.errors.assetId.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tla">TLA *</Label>
                          <Input
                            id="tla"
                            placeholder="PRODSUPP"
                            maxLength={12}
                            {...form.register('tla', {
                              onChange: (e) => {
                                checkTlaAvailability(e.target.value)
                              }
                            })}
                          />
                          {tlaAvailability && (
                            <p className={`text-sm ${tlaAvailability.available ? 'text-green-600' : 'text-red-500'}`}>
                              {tlaAvailability.message}
                            </p>
                          )}
                          {form.formState.errors.tla && (
                            <p className="text-sm text-red-500">{form.formState.errors.tla.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="escalationEmail">Escalation Email</Label>
                          <Input
                            id="escalationEmail"
                            type="email"
                            placeholder="team@example.com"
                            {...form.register('escalationEmail')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactEmail">Contact Email</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            placeholder="contact@example.com"
                            {...form.register('contactEmail')}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="teamEmail">Team Email</Label>
                          <Input
                            id="teamEmail"
                            type="email"
                            placeholder="team@example.com"
                            {...form.register('teamEmail')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="snowGroup">ServiceNow Group</Label>
                          <Input
                            id="snowGroup"
                            placeholder="team_support"
                            {...form.register('snowGroup')}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="slackChannel">Slack Channel</Label>
                          <Input
                            id="slackChannel"
                            placeholder="#team-channel"
                            {...form.register('slackChannel')}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Application description..."
                          {...form.register('description')}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={addApplicationMutation.isPending}>
                          {addApplicationMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            'Add Application'
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <Separator />

            {/* Applications Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Applications ({applications.length})</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
                <CardDescription>
                  Manage your team's applications and their configurations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No applications found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? 'Try a different search term' : 'Add your first application to get started'}
                    </p>
                    {!searchTerm && isAdmin && (
                      <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Application
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Application</TableHead>
                        <TableHead>TLA</TableHead>
                        <TableHead>Lifecycle</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app: any) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{app.applicationName}</p>
                              <p className="text-sm text-muted-foreground">Asset ID: {app.assetId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{app.tla}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={app.lifeCycleStatus === 'Production' ? 'default' : 'secondary'}>
                              {app.lifeCycleStatus || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{app.tier || 'Unknown'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {app.centralApiSyncStatus === 'success' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : app.centralApiSyncStatus === 'failed' ? (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-600" />
                              )}
                              <span className="text-sm">{app.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <div className="flex items-center border-r pr-1 mr-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openViewDialog(app)}
                                  className="h-8 w-8 p-0"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                                {isAdmin && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditDialog(app)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => syncApplicationMutation.mutate(app.id)}
                                  disabled={syncApplicationMutation.isPending}
                                  className="h-8 w-8 p-0"
                                >
                                  <RefreshCw className={`h-3 w-3 ${syncApplicationMutation.isPending ? 'animate-spin' : ''}`} />
                                </Button>
                                {isAdmin && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openDeleteDialog(app)}
                                    disabled={deleteApplicationMutation.isPending}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Edit Application Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit Application</DialogTitle>
                  <DialogDescription>
                    Update application details. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                {editingApplication && (
                  <form onSubmit={editForm.handleSubmit(onEditApplication)} className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editApplicationName">Application Name</Label>
                          <Input
                            id="editApplicationName"
                            value={editingApplication.applicationName}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            This field is read-only and synced from Central API
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editAssetId">Asset ID</Label>
                          <Input
                            id="editAssetId"
                            value={editingApplication.assetId}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            This field is read-only and synced from Central API
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editTla">TLA *</Label>
                          <Input
                            id="editTla"
                            placeholder="TLA"
                            maxLength={12}
                            {...editForm.register('tla', {
                              onChange: (e) => {
                                checkEditTlaAvailability(e.target.value, editingApplication.id)
                              }
                            })}
                          />
                          {editTlaAvailability && (
                            <p className={`text-sm ${editTlaAvailability.available ? 'text-green-600' : 'text-red-500'}`}>
                              {editTlaAvailability.message}
                            </p>
                          )}
                          {editForm.formState.errors.tla && (
                            <p className="text-sm text-red-500">{editForm.formState.errors.tla.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editLifecycleStatus">Lifecycle Status</Label>
                          <Input
                            id="editLifecycleStatus"
                            value={editingApplication.lifeCycleStatus || 'Unknown'}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            This field is read-only and synced from Central API
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Contact Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editEscalationEmail">Escalation Email</Label>
                          <Input
                            id="editEscalationEmail"
                            type="email"
                            placeholder="Escalation email"
                            {...editForm.register('escalationEmail')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editContactEmail">Contact Email</Label>
                          <Input
                            id="editContactEmail"
                            type="email"
                            placeholder="Contact email"
                            {...editForm.register('contactEmail')}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editTeamEmail">Team Email</Label>
                          <Input
                            id="editTeamEmail"
                            type="email"
                            placeholder="Team email"
                            {...editForm.register('teamEmail')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editSnowGroup">ServiceNow Group</Label>
                          <Input
                            id="editSnowGroup"
                            placeholder="ServiceNow group"
                            {...editForm.register('snowGroup')}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Integration Settings</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editSlackChannel">Slack Channel</Label>
                          <Input
                            id="editSlackChannel"
                            placeholder="#team-channel"
                            {...editForm.register('slackChannel')}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDescription">Description</Label>
                        <Textarea
                          id="editDescription"
                          placeholder="Application description..."
                          rows={3}
                          {...editForm.register('description')}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateApplicationMutation.isPending}>
                        {updateApplicationMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* View Application Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Application Details</DialogTitle>
                  <DialogDescription>
                    Complete information about this application.
                  </DialogDescription>
                </DialogHeader>
                {viewingApplication && (
                  <div className="space-y-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Application Name</Label>
                        <p className="font-medium text-sm">{viewingApplication.applicationName}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">TLA</Label>
                        <Badge variant="outline" className="text-xs">{viewingApplication.tla}</Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Asset ID</Label>
                        <p className="text-sm">{viewingApplication.assetId}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Lifecycle Status</Label>
                        <Badge variant={viewingApplication.lifeCycleStatus === 'Production' ? 'default' : 'secondary'} className="text-xs">
                          {viewingApplication.lifeCycleStatus || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Tier</Label>
                        <Badge variant="outline" className="text-xs">{viewingApplication.tier || 'Unknown'}</Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <div className="flex items-center gap-2">
                          {viewingApplication.centralApiSyncStatus === 'success' ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : viewingApplication.centralApiSyncStatus === 'failed' ? (
                            <AlertCircle className="h-3 w-3 text-red-600" />
                          ) : (
                            <Clock className="h-3 w-3 text-yellow-600" />
                          )}
                          <span className="text-xs">{viewingApplication.status}</span>
                        </div>
                      </div>
                    </div>

                    {viewingApplication.description && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <p className="text-sm text-muted-foreground">{viewingApplication.description}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Contact Information */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Contact Information</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {viewingApplication.ownerSvpName && (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <Shield className="h-4 w-4 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{viewingApplication.ownerSvpName}</p>
                              <p className="text-xs text-muted-foreground">SVP</p>
                            </div>
                          </div>
                        )}
                        {viewingApplication.applicationOwnerLeader1Name && (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <Users className="h-4 w-4 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{viewingApplication.applicationOwnerLeader1Name}</p>
                              <p className="text-xs text-muted-foreground">Owner Leader</p>
                            </div>
                          </div>
                        )}
                        {viewingApplication.applicationOwnerName && (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <Settings className="h-4 w-4 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{viewingApplication.applicationOwnerName}</p>
                              <p className="text-xs text-muted-foreground">Application Owner</p>
                            </div>
                          </div>
                        )}
                        {viewingApplication.applicationManagerName && (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <Globe className="h-4 w-4 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{viewingApplication.applicationManagerName}</p>
                              <p className="text-xs text-muted-foreground">Application Manager</p>
                            </div>
                          </div>
                        )}
                        {viewingApplication.productionSupportOwnerName && (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <ExternalLink className="h-4 w-4 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{viewingApplication.productionSupportOwnerName}</p>
                              <p className="text-xs text-muted-foreground">Production Support</p>
                            </div>
                          </div>
                        )}
                        {viewingApplication.pmoName && (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <Mail className="h-4 w-4 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{viewingApplication.pmoName}</p>
                              <p className="text-xs text-muted-foreground">PMO</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Integration Settings */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Integration Settings</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {viewingApplication.escalationEmail && (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium">Escalation Email</p>
                              <p className="text-xs text-muted-foreground truncate">{viewingApplication.escalationEmail}</p>
                            </div>
                          </div>
                        )}
                        {viewingApplication.contactEmail && (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium">Contact Email</p>
                              <p className="text-xs text-muted-foreground truncate">{viewingApplication.contactEmail}</p>
                            </div>
                          </div>
                        )}
                        {viewingApplication.teamEmail && (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium">Team Email</p>
                              <p className="text-xs text-muted-foreground truncate">{viewingApplication.teamEmail}</p>
                            </div>
                          </div>
                        )}
                        {viewingApplication.snowGroup && (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium">ServiceNow Group</p>
                              <p className="text-xs text-muted-foreground truncate">{viewingApplication.snowGroup}</p>
                            </div>
                          </div>
                        )}
                        {viewingApplication.slackChannel && (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium">Slack Channel</p>
                              <p className="text-xs text-muted-foreground truncate">{viewingApplication.slackChannel}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncApplicationMutation.mutate(viewingApplication.id)}
                          disabled={syncApplicationMutation.isPending}
                          className="gap-1 h-8 text-xs"
                        >
                          <RefreshCw className={`h-3 w-3 ${syncApplicationMutation.isPending ? 'animate-spin' : ''}`} />
                          Sync
                        </Button>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsViewDialogOpen(false)
                              openEditDialog(viewingApplication)
                            }}
                            className="gap-1 h-8 text-xs"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setIsViewDialogOpen(false)
                              openDeleteDialog(viewingApplication)
                            }}
                            disabled={deleteApplicationMutation.isPending}
                            className="gap-1 h-8 text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="h-8 text-xs">
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this application? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                {applicationToDelete && (
                  <div className="py-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Application:</p>
                        <p className="text-sm text-muted-foreground">{applicationToDelete.applicationName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">TLA:</p>
                        <Badge variant="outline" className="text-xs">{applicationToDelete.tla}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Asset ID:</p>
                        <p className="text-sm text-muted-foreground">{applicationToDelete.assetId}</p>
                      </div>
                    </div>
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This will permanently delete the application and all its associated data.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    disabled={deleteApplicationMutation.isPending}
                  >
                    {deleteApplicationMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>
      </div>
    </div>
  )
}