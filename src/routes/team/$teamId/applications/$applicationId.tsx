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

const UpdateApplicationSchema = z.object({
  tla: z.string().min(1, 'TLA is required').max(12, 'TLA must be 12 characters or less'),
  escalationEmail: z.string().email().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  teamEmail: z.string().email().optional().or(z.literal('')),
  snowGroup: z.string().max(255).optional(),
  slackChannel: z.string().max(100).optional(),
  description: z.string().optional()
})

export const Route = createFileRoute('/team/$teamId/applications/$applicationId')({
  component: ApplicationDetail,
})

function ApplicationDetail() {
  const { teamId, applicationId } = Route.useParams()
  const { user, teams, hasAccess } = useAuthContext()
  const queryClient = useQueryClient()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Fetch application details
  const { data: applicationData, isLoading: appLoading } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      const { getApplicationById } = await import('@/lib/server/applications')
      return getApplicationById({ data: applicationId })
    },
  })

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const { updateApplication } = await import('@/lib/server/applications')
      return updateApplication({
        data: {
          ...data,
          id: applicationId,
          updatedBy: user?.attributes?.email || 'unknown'
        }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['team-applications', teamId] })
      setIsEditDialogOpen(false)
    },
  })

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: async () => {
      const { deleteApplication } = await import('@/lib/server/applications')
      return deleteApplication({ data: applicationId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-applications', teamId] })
      // Navigate back to applications list
      window.location.href = `/team/${teamId}/applications`
    },
  })

  // Sync application mutation
  const syncApplicationMutation = useMutation({
    mutationFn: async () => {
      const { syncApplicationWithCentralApi } = await import('@/lib/server/applications')
      return syncApplicationWithCentralApi({ data: applicationId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] })
    },
  })

  const form = useForm<z.infer<typeof UpdateApplicationSchema>>({
    resolver: zodResolver(UpdateApplicationSchema),
    defaultValues: {
      tla: applicationData?.data?.tla || '',
      escalationEmail: applicationData?.data?.escalationEmail || '',
      contactEmail: applicationData?.data?.contactEmail || '',
      teamEmail: applicationData?.data?.teamEmail || '',
      snowGroup: applicationData?.data?.snowGroup || '',
      slackChannel: applicationData?.data?.slackChannel || '',
      description: applicationData?.data?.description || ''
    }
  })

  // Update form when application data is loaded
  React.useEffect(() => {
    if (applicationData?.data) {
      form.reset({
        tla: applicationData.data.tla || '',
        escalationEmail: applicationData.data.escalationEmail || '',
        contactEmail: applicationData.data.contactEmail || '',
        teamEmail: applicationData.data.teamEmail || '',
        snowGroup: applicationData.data.snowGroup || '',
        slackChannel: applicationData.data.slackChannel || '',
        description: applicationData.data.description || '',
      })
    }
  }, [applicationData, form])

  const onUpdateApplication = (values: z.infer<typeof UpdateApplicationSchema>) => {
    updateApplicationMutation.mutate(values)
  }

  const application = applicationData?.data
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
          isActive: false,
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
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link to={`/team/${teamId}/applications`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Applications
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {application?.applicationName || 'Application Details'}
                </h1>
                <p className="text-muted-foreground">
                  Manage application details and configurations.
                </p>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncApplicationMutation.mutate()}
                disabled={syncApplicationMutation.isPending}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncApplicationMutation.isPending ? 'animate-spin' : ''}`} />
                Sync with Central API
              </Button>
              {isAdmin && (
                <>
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Edit Application</DialogTitle>
                        <DialogDescription>
                          Update application details. Click save when you're done.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={form.handleSubmit(onUpdateApplication)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tla">TLA</Label>
                            <Input
                              id="tla"
                              placeholder="TLA"
                              maxLength={12}
                              {...form.register('tla')}
                            />
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
                              placeholder="Escalation email"
                              {...form.register('escalationEmail')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contactEmail">Contact Email</Label>
                            <Input
                              id="contactEmail"
                              type="email"
                              placeholder="Contact email"
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
                              placeholder="Team email"
                              {...form.register('teamEmail')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="snowGroup">ServiceNow Group</Label>
                            <Input
                              id="snowGroup"
                              placeholder="ServiceNow group"
                              {...form.register('snowGroup')}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="slackChannel">Slack Channel</Label>
                          <Input
                            id="slackChannel"
                            placeholder="#team-channel"
                            {...form.register('slackChannel')}
                          />
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
                          <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={updateApplicationMutation.isPending}>
                            {updateApplicationMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Application</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this application? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button
                          variant="destructive"
                          onClick={() => deleteApplicationMutation.mutate()}
                          disabled={deleteApplicationMutation.isPending}
                        >
                          {deleteApplicationMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>

            {appLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : application ? (
              <div className="grid gap-6">
                {/* Application Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Application Overview</CardTitle>
                    <CardDescription>
                      Basic information about the application.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="flex items-center space-x-4 rounded-md border p-4">
                        <Database className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            Application Name
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {application.applicationName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 rounded-md border p-4">
                        <Layers className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            TLA
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {application.tla}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 rounded-md border p-4">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            Asset ID
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {application.assetId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 rounded-md border p-4">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            Lifecycle Status
                          </p>
                          <Badge variant={application.lifeCycleStatus === 'Production' ? 'default' : 'secondary'}>
                            {application.lifeCycleStatus || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 rounded-md border p-4">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            Tier
                          </p>
                          <Badge variant="outline">{application.tier || 'Unknown'}</Badge>
                        </div>
                      </div>
                      {application.description && (
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                          <Database className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Description
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {application.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      Key contacts and stakeholders for this application.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="leadership" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="leadership">Leadership</TabsTrigger>
                        <TabsTrigger value="management">Management</TabsTrigger>
                        <TabsTrigger value="support">Support</TabsTrigger>
                      </TabsList>
                      <TabsContent value="leadership" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {application.ownerSvpName && (
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                              <Shield className="h-8 w-8 text-primary" />
                              <div>
                                <p className="font-medium">{application.ownerSvpName}</p>
                                <p className="text-sm text-muted-foreground">SVP</p>
                                {application.ownerSvpEmail && (
                                  <p className="text-xs text-muted-foreground">{application.ownerSvpEmail}</p>
                                )}
                              </div>
                            </div>
                          )}
                          {application.applicationOwnerLeader1Name && (
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                              <Users className="h-8 w-8 text-primary" />
                              <div>
                                <p className="font-medium">{application.applicationOwnerLeader1Name}</p>
                                <p className="text-sm text-muted-foreground">Owner Leader</p>
                                {application.applicationOwnerLeader1Email && (
                                  <p className="text-xs text-muted-foreground">{application.applicationOwnerLeader1Email}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="management" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {application.applicationOwnerName && (
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                              <Settings className="h-8 w-8 text-primary" />
                              <div>
                                <p className="font-medium">{application.applicationOwnerName}</p>
                                <p className="text-sm text-muted-foreground">Application Owner</p>
                                {application.applicationOwnerEmail && (
                                  <p className="text-xs text-muted-foreground">{application.applicationOwnerEmail}</p>
                                )}
                              </div>
                            </div>
                          )}
                          {application.applicationManagerName && (
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                              <Globe className="h-8 w-8 text-primary" />
                              <div>
                                <p className="font-medium">{application.applicationManagerName}</p>
                                <p className="text-sm text-muted-foreground">Application Manager</p>
                                {application.applicationManagerEmail && (
                                  <p className="text-xs text-muted-foreground">{application.applicationManagerEmail}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="support" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {application.productionSupportOwnerName && (
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                              <ExternalLink className="h-8 w-8 text-primary" />
                              <div>
                                <p className="font-medium">{application.productionSupportOwnerName}</p>
                                <p className="text-sm text-muted-foreground">Production Support</p>
                                {application.productionSupportOwnerEmail && (
                                  <p className="text-xs text-muted-foreground">{application.productionSupportOwnerEmail}</p>
                                )}
                              </div>
                            </div>
                          )}
                          {application.pmoName && (
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                              <Mail className="h-8 w-8 text-primary" />
                              <div>
                                <p className="font-medium">{application.pmoName}</p>
                                <p className="text-sm text-muted-foreground">PMO</p>
                                {application.pmoEmail && (
                                  <p className="text-xs text-muted-foreground">{application.pmoEmail}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Integration Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Integration Settings</CardTitle>
                    <CardDescription>
                      External system integrations and communication channels.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {application.escalationEmail && (
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Escalation Email
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {application.escalationEmail}
                            </p>
                          </div>
                        </div>
                      )}
                      {application.contactEmail && (
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Contact Email
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {application.contactEmail}
                            </p>
                          </div>
                        </div>
                      )}
                      {application.teamEmail && (
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Team Email
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {application.teamEmail}
                            </p>
                          </div>
                        </div>
                      )}
                      {application.snowGroup && (
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                          <Briefcase className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              ServiceNow Group
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {application.snowGroup}
                            </p>
                          </div>
                        </div>
                      )}
                      {application.slackChannel && (
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Slack Channel
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {application.slackChannel}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Application not found</AlertDescription>
              </Alert>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}