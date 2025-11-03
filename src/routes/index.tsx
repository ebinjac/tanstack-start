import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCurrentUser, useIsAdmin } from '@/contexts/auth-context'
import EnsembleLogo from '@/components/ensemble-logo'
import { MainHeader } from '@/components/layout/main-header'
import {
  ArrowRight,
  Bell,
  BarChart3,
  Users,
  FileText,
  Shield,
  Clock,
  CheckCircle,
  Star,
  Zap,
  Globe,
  Lightbulb,
  Settings,
  Mail,
  Calendar,
  TrendingUp,
  Package,
  Lock,
  RefreshCw
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const user = useCurrentUser()
  const isAdmin = useIsAdmin()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <MainHeader />
      </div>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
          <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
          <div className="container relative mx-auto px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="mb-8"
              >
                <div className="mx-auto h-24 w-24">
                  <EnsembleLogo />
                </div>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl"
              >
                One Platform.
                <span className="block text-primary">Endless Efficiency.</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground"
              >
                Ensemble brings together all the essential tools and automations your team needs — 
                from notifications and scorecards to handovers and planning — all in one unified portal.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                {user ? (
                  <Link to="/team/register">
                    <Button size="lg" className="gap-2">
                      Open Ensemble
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button size="lg" className="gap-2" onClick={() => window.location.href = '/api/auth/login'}>
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                
                <Button variant="outline" size="lg" className="gap-2">
                  View Tools
                  <Package className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <Badge variant="secondary" className="mb-4">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  About Ensemble
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  What is Ensemble?
                </h2>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true }}
                className="prose prose-lg mx-auto text-muted-foreground"
              >
                <p className="text-lg leading-8">
                  Ensemble is an internal productivity and automation platform built to simplify day-to-day operations for teams. 
                  It centralizes tools that were previously scattered across different systems — enabling faster workflows, 
                  better visibility, and reduced manual effort.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
                className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Why Ensemble?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Every team depends on multiple applications, reports, and automations. 
                      Ensemble eliminates the context switching by integrating them under a single, 
                      cohesive interface — designed with reliability, security, and ease of use in mind.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      How Ensemble Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Teams Onboard</p>
                          <p className="text-sm text-muted-foreground">Teams provide their AD group information and get onboarded to Ensemble.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">2</span>
                        </div>
                        <div>
                          <p className="font-medium">Applications Added</p>
                          <p className="text-sm text-muted-foreground">Each team adds their applications under their profile.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="py-24 sm:py-32 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <Badge variant="secondary" className="mb-4">
                <Settings className="h-3 w-3 mr-1" />
                Key Features
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Powerful Tools for Modern Teams
              </h2>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          {feature.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{feature.title}</CardTitle>
                          <CardDescription>{feature.subtitle}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {feature.features.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <Badge variant="secondary" className="mb-4">
                <TrendingUp className="h-3 w-3 mr-1" />
                  Impact & Results
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Transforming Team Productivity
              </h2>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">{stat.label}</div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 sm:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                Ready to Transform Your Team's Workflow?
              </h2>
              <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
                Join teams that are already using Ensemble to streamline their operations and boost productivity.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  <Link to="/team/register">
                    <Button size="lg" variant="secondary" className="gap-2">
                      Open Ensemble
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button size="lg" variant="secondary" className="gap-2" onClick={() => window.location.href = '/api/auth/login'}>
                    Get Started Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                
                {isAdmin && (
                  <Link to="/admin/dashboard">
                    <Button size="lg" variant="outline" className="gap-2 border-white text-white hover:bg-white hover:text-primary">
                      Admin Dashboard
                      <Shield className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
  )
}

const features = [
  {
    title: "Notification Editor",
    subtitle: "Create and manage notifications effortlessly",
    icon: <Bell className="h-6 w-6 text-primary" />,
    features: [
      "Rich HTML editor for templates",
      "Seamless team collaboration",
      "Integration-ready outputs"
    ]
  },
  {
    title: "Scorecard Metrics",
    subtitle: "Automate your scorecard generation process",
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    features: [
      "Auto-fetch and calculate key metrics",
      "Custom views for different applications",
      "Export-ready data"
    ]
  },
  {
    title: "Shift Handover (Tohub)",
    subtitle: "Ensure smooth transitions between shifts",
    icon: <RefreshCw className="h-6 w-6 text-primary" />,
    features: [
      "Pre-filled handover templates",
      "Track pending actions and incidents",
      "Archive for audit and traceability"
    ]
  },
  {
    title: "Certificate & Service ID Management (CERSER)",
    subtitle: "Keep track of expiring certificates and service IDs",
    icon: <Shield className="h-6 w-6 text-primary" />,
    features: [
      "Centralized tracking dashboard",
      "Automated expiry notifications",
      "Validation and planning modules"
    ]
  },
  {
    title: "INS Notification Automation (NSIMPLE)",
    subtitle: "Reduce repetitive manual work with automation",
    icon: <Mail className="h-6 w-6 text-primary" />,
    features: [
      "Template-driven automation",
      "Audit logs and history tracking",
      "Configurable recipients and channels"
    ]
  },
  {
    title: "Team Management",
    subtitle: "Comprehensive team and access management",
    icon: <Users className="h-6 w-6 text-primary" />,
    features: [
      "Active Directory integration",
      "Role-based access control",
      "Team collaboration tools"
    ]
  }
]

const stats = [
  {
    value: "50%",
    label: "Time Saved",
    description: "Average reduction in manual workflow time"
  },
  {
    value: "100%",
    label: "Audit Trail",
    description: "Complete visibility into all operations"
  },
  {
    value: "24/7",
    label: "Availability",
    description: "Round-the-clock access to all tools"
  }
]
