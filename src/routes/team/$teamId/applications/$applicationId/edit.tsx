import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

export const Route = createFileRoute('/team/$teamId/applications/$applicationId/edit')({
  component: EditApplication,
})

function EditApplication() {
  const { teamId, applicationId } = Route.useParams()
  const { user, teams, hasAccess } = useAuthContext()
  const queryClient = useQueryClient()

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
      // Navigate back to application details
      window.location.href = `/team/${teamId}/applications/${applicationId}`
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
                <Link to={`/team/${teamId}/applications/${applicationId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Application
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Edit Application
                </h1>
                <p className="text-muted-foreground">
                  Update application details and configurations.
                </p>
              </div>
            </div>

            <Separator />

            {appLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : application ? (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Details</CardTitle>
                    <CardDescription>
                      Update application information. Click save when you're done.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={form.handleSubmit(onUpdateApplication)} className="space-y-6">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="applicationName">Application Name</Label>
                            <Input
                              id="applicationName"
                              value={application.applicationName}
                              disabled
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                              This field is read-only and synced from Central API
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="assetId">Asset ID</Label>
                            <Input
                              id="assetId"
                              value={application.assetId}
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
                            <Label htmlFor="tla">TLA *</Label>
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
                          <div className="space-y-2">
                            <Label htmlFor="lifecycleStatus">Lifecycle Status</Label>
                            <Input
                              id="lifecycleStatus"
                              value={application.lifeCycleStatus || 'Unknown'}
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
                        <h3 className="text-lg font-medium">Contact Information</h3>
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
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Integration Settings</h3>
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
                            rows={4}
                            {...form.register('description')}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" asChild>
                          <Link to={`/team/${teamId}/applications/${applicationId}`}>
                            Cancel
                          </Link>
                        </Button>
                        <Button type="submit" disabled={updateApplicationMutation.isPending}>
                          {updateApplicationMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
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