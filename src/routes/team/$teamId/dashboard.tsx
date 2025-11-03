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
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAuthContext } from '@/contexts/auth-context'
import { Link } from '@tanstack/react-router'
import { MainHeader } from '@/components/layout/main-header'
import {
  Building2,
  Users,
  Plus,
  Settings,
  Edit,
  ExternalLink,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Globe,
  Layers,
  Database,
  ChevronRight,
  UserCheck,
  Lock,
  Bell,
  Palette,
  Globe2,
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

const UpdateTeamSchema = z.object({
  teamName: z.string().min(1, 'Team name is required').max(100, 'Team name must be less than 100 characters'),
  userGroup: z.string().min(1, 'User group is required').max(100, 'User group must be less than 100 characters'),
  adminGroup: z.string().min(1, 'Admin group is required').max(100, 'Admin group must be less than 100 characters'),
  contactName: z.string().min(1, 'Contact name is required').max(100, 'Contact name must be less than 100 characters'),
  contactEmail: z.string().min(1, 'Contact email is required').max(255, 'Contact email must be less than 255 characters').email('Invalid email address'),
})

export const Route = createFileRoute('/team/$teamId/dashboard')({
  component: TeamDashboard,
})

function TeamDashboard() {
  const { teamId } = Route.useParams()
  const { user, teams, hasAccess } = useAuthContext()
  const queryClient = useQueryClient()
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false)

  // Fetch team details
  const { data: teamDetails, isLoading: teamLoading } = useQuery({
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

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async (data: any) => {
      // For now, we'll create a simple update function
      // In a real implementation, you'd have a proper updateTeam function
      return { success: true, message: 'Team updated successfully' }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-details', teamId] })
      setIsEditTeamDialogOpen(false)
    },
  })

  const teamForm = useForm<z.infer<typeof UpdateTeamSchema>>({
    resolver: zodResolver(UpdateTeamSchema),
    defaultValues: {
      teamName: teamDetails?.data?.teamName || '',
      userGroup: teamDetails?.data?.userGroup || '',
      adminGroup: teamDetails?.data?.adminGroup || '',
      contactName: teamDetails?.data?.contactName || '',
      contactEmail: teamDetails?.data?.contactEmail || '',
    }
  })

  // Update form when team data is loaded
  React.useEffect(() => {
    if (teamDetails?.data) {
      teamForm.reset({
        teamName: teamDetails.data.teamName,
        userGroup: teamDetails.data.userGroup,
        adminGroup: teamDetails.data.adminGroup,
        contactName: teamDetails.data.contactName,
        contactEmail: teamDetails.data.contactEmail,
      })
    }
  }, [teamDetails, teamForm])

  const onUpdateTeam = (values: z.infer<typeof UpdateTeamSchema>) => {
    updateTeamMutation.mutate(values)
  }

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
          isActive: true,
        },
        {
          title: "Applications",
          url: `/team/${teamId}/applications`,
          icon: Package,
          isActive: false,
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
                <h1 className="text-3xl font-bold tracking-tight">Team Settings</h1>
                <p className="text-muted-foreground">
                  Manage your team settings and applications.
                </p>
              </div>
            </div>

            <Separator />

            {/* Team Information Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Team Information</CardTitle>
                  {isAdmin && (
                    <Dialog open={isEditTeamDialogOpen} onOpenChange={setIsEditTeamDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Edit Team Information</DialogTitle>
                          <DialogDescription>
                            Update your team details. Click save when you're done.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={teamForm.handleSubmit(onUpdateTeam)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="teamName">Team Name</Label>
                              <Input
                                id="teamName"
                                placeholder="Team name"
                                {...teamForm.register('teamName')}
                              />
                              {teamForm.formState.errors.teamName && (
                                <p className="text-sm text-red-500">{teamForm.formState.errors.teamName.message}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="contactName">Contact Name</Label>
                              <Input
                                id="contactName"
                                placeholder="Contact name"
                                {...teamForm.register('contactName')}
                              />
                              {teamForm.formState.errors.contactName && (
                                <p className="text-sm text-red-500">{teamForm.formState.errors.contactName.message}</p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="userGroup">User Group</Label>
                              <Input
                                id="userGroup"
                                placeholder="User group"
                                {...teamForm.register('userGroup')}
                              />
                              {teamForm.formState.errors.userGroup && (
                                <p className="text-sm text-red-500">{teamForm.formState.errors.userGroup.message}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="adminGroup">Admin Group</Label>
                              <Input
                                id="adminGroup"
                                placeholder="Admin group"
                                {...teamForm.register('adminGroup')}
                              />
                              {teamForm.formState.errors.adminGroup && (
                                <p className="text-sm text-red-500">{teamForm.formState.errors.adminGroup.message}</p>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contactEmail">Contact Email</Label>
                            <Input
                              id="contactEmail"
                              type="email"
                              placeholder="Contact email"
                              {...teamForm.register('contactEmail')}
                            />
                            {teamForm.formState.errors.contactEmail && (
                              <p className="text-sm text-red-500">{teamForm.formState.errors.contactEmail.message}</p>
                            )}
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditTeamDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={updateTeamMutation.isPending}>
                              {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <CardDescription>
                  Basic information about your team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : team ? (
                  <div className="grid gap-4">
                    <div className="flex items-center space-x-4 rounded-md border p-4">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Team Name
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {team.teamName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 rounded-md border p-4">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          User Group
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {team.userGroup}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 rounded-md border p-4">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Admin Group
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {team.adminGroup}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 rounded-md border p-4">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Contact Information
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {team.contactName} - {team.contactEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Team not found</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Applications Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Applications</CardTitle>
                  <Button asChild>
                    <Link to={`/team/${teamId}/applications`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Manage Applications
                    </Link>
                  </Button>
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
                ) : applications.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No applications</h3>
                    <p className="text-muted-foreground mb-4">
                      {isAdmin ? 'Add your first application to get started' : 'No applications have been added to this team yet.'}
                    </p>
                    {isAdmin && (
                      <Button asChild>
                        <Link to={`/team/${teamId}/applications`}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Application
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Your team has {applications.length} application{applications.length !== 1 ? 's' : ''}
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/team/${teamId}/applications`}>
                          View All
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      {applications.slice(0, 3).map((app: any) => (
                        <div key={app.id} className="flex items-center space-x-4 rounded-md border p-4">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {app.applicationName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              TLA: {app.tla} • Status: {app.status}
                            </p>
                          </div>
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/team/${teamId}/applications/${app.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}