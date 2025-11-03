import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AuthProvider } from '@/contexts/auth-context'
import { MainHeader } from '@/components/layout/main-header'
import { Link } from '@tanstack/react-router'
import { serverCreateTeamRegistration } from '@/lib/server/team-registration'
import { TeamRegistrationSchema } from '@/lib/server/team-registration'
import { useDebounceTeamName } from '@/hooks/use-debounce-team-name'
import {
  Building2,
  Users,
  Mail,
  CheckCircle,
  ArrowRight,
  Shield,
  Zap,
  AlertCircle,
  Loader2,
  Circle
} from 'lucide-react'

export const Route = createFileRoute('/team/register')({
  component: TeamRegister,
})

function TeamRegister() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    teamName: '',
    userGroup: '',
    adminGroup: '',
    contactName: '',
    contactEmail: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  // Debounced team name validation
  const { isChecking, result: teamNameCheck } = useDebounceTeamName(formData.teamName, {
    minLength: 2,
    debounceMs: 500,
    enabled: touchedFields.teamName
  })

  const createRegistrationMutation = useMutation({
    mutationFn: (data: typeof formData) => serverCreateTeamRegistration({ data }),
    onSuccess: (result) => {
      if (result.success) {
        // Use TanStack Start's navigate for proper routing without page reload
        navigate({
          to: '/team-confirmation',
          search: {
            registrationId: result.data.id,
            teamName: result.data.teamName
          }
        })
      }
    },
    onError: (error: Error) => {
      // Handle validation errors
      if (error.message.includes('already exists')) {
        setErrors({ teamName: error.message })
      } else {
        setErrors({ general: error.message })
      }
    }
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [field]: true }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }))
  }

  const validateForm = () => {
    try {
      TeamRegistrationSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof Error) {
        // Handle Zod validation errors
        const fieldErrors: Record<string, string> = {}
        if (error.message.includes('Team name')) {
          fieldErrors.teamName = 'Team name is required and must be less than 100 characters'
        }
        if (error.message.includes('User group')) {
          fieldErrors.userGroup = 'User group is required and must be less than 100 characters'
        }
        if (error.message.includes('Admin group')) {
          fieldErrors.adminGroup = 'Admin group is required and must be less than 100 characters'
        }
        if (error.message.includes('Contact name')) {
          fieldErrors.contactName = 'Contact name is required and must be less than 100 characters'
        }
        if (error.message.includes('Contact email')) {
          fieldErrors.contactEmail = 'Valid contact email is required'
        }
        setErrors(fieldErrors)
      }
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      createRegistrationMutation.mutate(formData)
    }
  }

  const getTeamNameValidation = () => {
    if (!touchedFields.teamName || formData.teamName.length < 2) {
      return null
    }

    if (isChecking) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking availability...
        </div>
      )
    }

    if (teamNameCheck) {
      const iconClass = teamNameCheck.type === 'success' ? 'text-green-600' : 
                        teamNameCheck.type === 'warning' ? 'text-yellow-600' : 'text-red-600'
      const Icon = teamNameCheck.type === 'success' ? CheckCircle : 
                   teamNameCheck.type === 'warning' ? AlertCircle : Circle

      return (
        <div className={`flex items-center gap-2 text-sm ${iconClass}`}>
          <Icon className="h-4 w-4" />
          {teamNameCheck.message}
        </div>
      )
    }

    return null
  }

  const isFormValid = () => {
    return Object.values(formData).every(value => value.trim() !== '') &&
           !errors.teamName &&
           !errors.userGroup &&
           !errors.adminGroup &&
           !errors.contactName &&
           !errors.contactEmail &&
           teamNameCheck?.available !== false
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <MainHeader />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-8"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-4">
                Register Your Team
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Join Ensemble to manage your team's reliability operations in one unified platform.
              </p>
            </motion.div>

            {/* Registration Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Team Information</CardTitle>
                  <CardDescription>
                    Fill in your team details to get started with Ensemble
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {errors.general && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                      <p className="text-destructive text-sm">{errors.general}</p>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Team Name */}
                    <div className="space-y-2">
                      <Label htmlFor="teamName">Team Name *</Label>
                      <Input
                        id="teamName"
                        value={formData.teamName}
                        onChange={(e) => handleInputChange('teamName', e.target.value)}
                        onBlur={() => handleFieldBlur('teamName')}
                        placeholder="e.g., Backend Infrastructure"
                        className={`w-full ${errors.teamName ? 'border-destructive' : ''}`}
                      />
                      {errors.teamName && (
                        <p className="text-destructive text-sm">{errors.teamName}</p>
                      )}
                      {getTeamNameValidation()}
                    </div>

                    {/* User Group */}
                    <div className="space-y-2">
                      <Label htmlFor="userGroup">User Group *</Label>
                      <Input
                        id="userGroup"
                        value={formData.userGroup}
                        onChange={(e) => handleInputChange('userGroup', e.target.value)}
                        onBlur={() => handleFieldBlur('userGroup')}
                        placeholder="e.g., backend-infra-users"
                        className={`w-full ${errors.userGroup ? 'border-destructive' : ''}`}
                      />
                      {errors.userGroup && (
                        <p className="text-destructive text-sm">{errors.userGroup}</p>
                      )}
                    </div>

                    {/* Admin Group */}
                    <div className="space-y-2">
                      <Label htmlFor="adminGroup">Admin Group *</Label>
                      <Input
                        id="adminGroup"
                        value={formData.adminGroup}
                        onChange={(e) => handleInputChange('adminGroup', e.target.value)}
                        onBlur={() => handleFieldBlur('adminGroup')}
                        placeholder="e.g., backend-infra-admins"
                        className={`w-full ${errors.adminGroup ? 'border-destructive' : ''}`}
                      />
                      {errors.adminGroup && (
                        <p className="text-destructive text-sm">{errors.adminGroup}</p>
                      )}
                    </div>

                    {/* Contact Name */}
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name *</Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => handleInputChange('contactName', e.target.value)}
                        onBlur={() => handleFieldBlur('contactName')}
                        placeholder="Team lead or primary contact"
                        className={`w-full ${errors.contactName ? 'border-destructive' : ''}`}
                      />
                      {errors.contactName && (
                        <p className="text-destructive text-sm">{errors.contactName}</p>
                      )}
                    </div>

                    {/* Contact Email */}
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        onBlur={() => handleFieldBlur('contactEmail')}
                        placeholder="team@example.com"
                        className={`w-full ${errors.contactEmail ? 'border-destructive' : ''}`}
                      />
                      {errors.contactEmail && (
                        <p className="text-destructive text-sm">{errors.contactEmail}</p>
                      )}
                    </div>

                    {/* Info Section */}
                    <div className="bg-muted/50 border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">What happens next?</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Your registration request will be submitted for admin approval</li>
                            <li>• You'll receive an email confirmation with your request details</li>
                            <li>• Once approved, your team will be created with default settings</li>
                            <li>• You'll get access to all Ensemble features after approval</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                      <Link to="/">
                        <Button variant="outline" type="button" className="w-full sm:w-auto">
                          Back to Home
                        </Button>
                      </Link>
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="gap-2 w-full sm:w-auto"
                        disabled={createRegistrationMutation.isPending || !isFormValid()}
                      >
                        {createRegistrationMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Building2 className="h-4 w-4" />
                            Submit Registration
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="mt-8 text-center"
            >
              <p className="text-muted-foreground mb-4">
                Questions about team registration or Ensemble capabilities?
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Support
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}