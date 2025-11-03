import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { AuthProvider } from '@/contexts/auth-context'
import { MainHeader } from '@/components/layout/main-header'
import { Link } from '@tanstack/react-router'
import {
  CheckCircle,
  Clock,
  Mail,
  Users,
  Building2,
  AlertCircle,
  ArrowLeft,
  Home,
  Bell,
  Calendar,
  User,
  Eye,
  FileText,
  RefreshCw
} from 'lucide-react'

export const Route = createFileRoute('/team-confirmation')({
  component: RegistrationConfirmation,
  validateSearch: (search: Record<string, unknown>) => ({
    registrationId: search.registrationId as string,
    teamName: search.teamName as string,
  }),
})

function RegistrationConfirmation() {
  const { registrationId, teamName } = Route.useSearch()

  // Mock registration data - in a real implementation, you'd fetch this
  const registrationData = {
    id: registrationId,
    teamName: teamName,
    status: 'pending' as const,
    requestedAt: new Date().toISOString(),
    contactEmail: 'team@example.com',
    estimatedApprovalTime: '1-2 business days'
  }

  const timelineSteps = [
    {
      icon: <FileText className="h-4 w-4" />,
      title: "Registration Submitted",
      description: "Your request has been received and is being reviewed",
      status: "completed" as const,
      time: "Just now"
    },
    {
      icon: <Eye className="h-4 w-4" />,
      title: "Admin Review",
      description: "Our administrators are reviewing your request",
      status: "current" as const,
      time: "In progress"
    },
    {
      icon: <CheckCircle className="h-4 w-4" />,
      title: "Team Created",
      description: "Your team will be created and ready to use",
      status: "upcoming" as const,
      time: "Pending"
    }
  ]

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <MainHeader />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Success Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="h-10 w-10 text-primary-foreground" />
              </motion.div>
              <h1 className="text-4xl font-bold mb-4">
                Registration Submitted!
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Your team registration request for <span className="font-semibold text-primary">{teamName}</span> has been successfully submitted and is now pending admin approval.
              </p>
            </motion.div>

            {/* Status Alert */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8"
            >
              <Alert className="border-primary/20 bg-primary/5">
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-base">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-base">Registration Status</span>
                      <div className="relative">
                        <div className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full flex items-center gap-1.5 shadow-sm">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span>Pending Review</span>
                        </div>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-sm opacity-30 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Your team registration is being reviewed by our administrators.
                    </div>
                    <div className="text-sm">
                      Registration ID: <span className="font-mono bg-muted px-2 py-1 rounded">{registrationId}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Registration Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="lg:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Registration Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          Team Name
                        </div>
                        <p className="text-base font-semibold">{registrationData.teamName}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          Registration ID
                        </div>
                        <p className="text-base font-mono text-sm bg-muted px-2 py-1 rounded">{registrationData.id}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Submitted On
                        </div>
                        <p className="text-base">{new Date(registrationData.requestedAt).toLocaleDateString()} at {new Date(registrationData.requestedAt).toLocaleTimeString()}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Estimated Approval Time
                        </div>
                        <p className="text-base">{registrationData.estimatedApprovalTime}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <User className="h-4 w-4" />
                        Contact Information
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-base">{registrationData.contactEmail}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Timeline */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Approval Process
                    </CardTitle>
                    <CardDescription>
                      Track your registration status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {timelineSteps.map((step, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              step.status === 'completed' ? 'bg-primary text-primary-foreground' :
                              step.status === 'current' ? 'bg-primary text-primary-foreground' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {step.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium">{step.title}</h4>
                              {step.status === 'completed' && <CheckCircle className="h-3 w-3 text-primary" />}
                              {step.status === 'current' && <Clock className="h-3 w-3 text-primary animate-pulse" />}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{step.description}</p>
                            <p className="text-xs text-muted-foreground">{step.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* What Happens Next */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    What Happens Next?
                  </CardTitle>
                  <CardDescription>
                    Here's what to expect during the approval process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold">Email Notification</h4>
                      <p className="text-sm text-muted-foreground">
                        You'll receive an email when your registration is approved or if additional information is needed.
                      </p>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold">Team Creation</h4>
                      <p className="text-sm text-muted-foreground">
                        Once approved, your team will be created with default settings and you'll receive setup instructions.
                      </p>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold">Team Access</h4>
                      <p className="text-sm text-muted-foreground">
                        You can start inviting team members and accessing Ensemble features after approval.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/">
                <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                  <Home className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                <Mail className="h-4 w-4" />
                Contact Support
              </Button>
              
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Bell className="h-4 w-4" />
                Check Status
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}