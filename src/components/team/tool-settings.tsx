import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Settings,
  RefreshCw,
  Save,
  RotateCcw,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Power,
  PowerOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import {
  serverGetToolSettings,
  serverGetTeamToolSettings,
  serverUpdateToolSettings,
  serverResetToolSettings,
  serverGetFeatureFlags,
  serverUpdateTeamFeatureFlag
} from '@/lib/server/settings'
import {
  serverCheckFeatureAccess
} from '@/lib/server/feature-flags'

// Types
interface ToolSetting {
  toolKey: string
  schema: {
    name: string
    description?: string
    category: string
    settingsTemplate: Record<string, any>
    validationSchema?: Record<string, any>
    isTeamConfigurable: boolean
  }
  settings: Record<string, any>
  isGlobal: boolean
}

interface FeatureFlag {
  id: string
  key: string
  name: string
  description?: string
  status: string
  teamOverride?: {
    isEnabled: boolean
    settings: Record<string, any>
  }
  effectiveStatus: string
}

// Tool Settings Form Component
function ToolSettingsForm({ tool, onSave, onReset }: {
  tool: ToolSetting
  onSave: (toolKey: string, settings: Record<string, any>) => void
  onReset: (toolKey: string) => void
}) {
  const [formData, setFormData] = useState(tool.settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const renderSettingField = (key: string, config: any) => {
    const value = formData[key] || config.default

    switch (config.type) {
      case 'number':
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{config.label}</Label>
            <Input
              id={key}
              type="number"
              value={value}
              min={config.min}
              max={config.max}
              onChange={(e) => {
                const newValue = parseInt(e.target.value) || config.default
                setFormData({ ...formData, [key]: newValue })
                setHasChanges(true)
              }}
            />
            {config.description && (
              <p className="text-xs text-muted-foreground">{config.description}</p>
            )}
          </div>
        )

      case 'boolean':
        return (
          <div key={key} className="flex items-center justify-between">
            <div>
              <Label htmlFor={key}>{config.label}</Label>
              {config.description && (
                <p className="text-xs text-muted-foreground">{config.description}</p>
              )}
            </div>
            <Switch
              id={key}
              checked={value}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, [key]: checked })
                setHasChanges(true)
              }}
            />
          </div>
        )

      case 'select':
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{config.label}</Label>
            <Select
              value={value}
              onValueChange={(newValue) => {
                setFormData({ ...formData, [key]: newValue })
                setHasChanges(true)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {config.description && (
              <p className="text-xs text-muted-foreground">{config.description}</p>
            )}
          </div>
        )

      case 'array':
        return (
          <div key={key} className="space-y-2">
            <Label>{config.label}</Label>
            <div className="space-y-2">
              {config.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <Switch
                    id={`${key}-${option}`}
                    checked={Array.isArray(value) && value.includes(option)}
                    onCheckedChange={(checked) => {
                      const currentArray = Array.isArray(value) ? value : []
                      const newArray = checked
                        ? [...currentArray, option]
                        : currentArray.filter((item: string) => item !== option)
                      setFormData({ ...formData, [key]: newArray })
                      setHasChanges(true)
                    }}
                  />
                  <Label htmlFor={`${key}-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {config.description && (
              <p className="text-xs text-muted-foreground">{config.description}</p>
            )}
          </div>
        )

      case 'string':
      default:
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{config.label}</Label>
            <Input
              id={key}
              value={value}
              onChange={(e) => {
                setFormData({ ...formData, [key]: e.target.value })
                setHasChanges(true)
              }}
            />
            {config.description && (
              <p className="text-xs text-muted-foreground">{config.description}</p>
            )}
          </div>
        )
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(tool.toolKey, formData)
      setHasChanges(false)
      toast.success(`${tool.schema.name} settings saved`)
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      await onReset(tool.toolKey)
      setFormData(tool.schema.settingsTemplate)
      setHasChanges(false)
      toast.success(`${tool.schema.name} settings reset to defaults`)
    } catch (error) {
      toast.error('Failed to reset settings')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{tool.schema.name}</CardTitle>
            <CardDescription>{tool.schema.description}</CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            {tool.schema.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!tool.schema.isTeamConfigurable && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This tool's settings are managed at the global level by administrators.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {Object.entries(tool.schema.settingsTemplate).map(([key, config]) =>
            renderSettingField(key, config)
          )}
        </div>

        {tool.schema.isTeamConfigurable && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Feature Toggle Component
function FeatureToggle({ feature, onToggle }: {
  feature: FeatureFlag
  onToggle: (featureId: string, isEnabled: boolean) => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  const statusIcons = {
    enabled: <CheckCircle className="h-4 w-4 text-green-600" />,
    disabled: <XCircle className="h-4 w-4 text-red-600" />,
    beta: <AlertCircle className="h-4 w-4 text-yellow-600" />,
    'coming soon': <Clock className="h-4 w-4 text-gray-600" />,
  }

  const statusColors = {
    enabled: 'bg-green-100 text-green-800 border-green-200',
    disabled: 'bg-red-100 text-red-800 border-red-200',
    beta: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'coming soon': 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const isEnabled = feature.effectiveStatus === 'enabled'

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      await onToggle(feature.id, !isEnabled)
      toast.success(`${feature.name} ${!isEnabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      toast.error('Failed to update feature')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 border rounded-lg"
    >
      <div className="flex items-center gap-3">
        {statusIcons[feature.effectiveStatus as keyof typeof statusIcons]}
        <div>
          <h4 className="font-medium">{feature.name}</h4>
          <p className="text-sm text-muted-foreground">{feature.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={statusColors[feature.effectiveStatus as keyof typeof statusColors]}>
          {feature.effectiveStatus}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          {isEnabled ? (
            <Power className="h-4 w-4 text-green-600" />
          ) : (
            <PowerOff className="h-4 w-4 text-red-600" />
          )}
        </Button>
      </div>
    </motion.div>
  )
}

// Main Team Settings Component
export function TeamToolSettings() {
  const { teamId } = useParams({ from: '/team/$teamId/settings' })
  const queryClient = useQueryClient()

  const { data: tools, isLoading: toolsLoading } = useSuspenseQuery({
    queryKey: ['team-tool-settings', teamId],
    queryFn: async () => {
      // Get all tool schemas first
      const schemasResponse = await import('@/lib/server/settings').then(m =>
        m.serverGetToolSchemas()
      )

      if (!schemasResponse.success) {
        throw new Error(schemasResponse.error)
      }

      const schemas = schemasResponse.data

      // Get settings for each tool
      const toolsWithSettings = await Promise.all(
        schemas.map(async (schema) => {
          const settingsResponse = await serverGetToolSettings({
            data: { teamId: teamId!, toolKey: schema.toolKey }
          })

          return settingsResponse.success ? settingsResponse.data : null
        })
      )

      return toolsWithSettings.filter(Boolean)
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: features, isLoading: featuresLoading } = useSuspenseQuery({
    queryKey: ['team-features', teamId],
    queryFn: () => serverGetFeatureFlags({ data: { teamId, includeDisabled: true } }),
    staleTime: 5 * 60 * 1000,
  })

  const updateSettingsMutation = useMutation({
    mutationFn: ({ toolKey, settings }: { toolKey: string; settings: Record<string, any> }) =>
      serverUpdateToolSettings({ data: { teamId: teamId!, toolKey, settings } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-tool-settings', teamId] })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update settings')
    },
  })

  const resetSettingsMutation = useMutation({
    mutationFn: (toolKey: string) =>
      serverResetToolSettings({ data: { teamId: teamId!, toolKey } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-tool-settings', teamId] })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reset settings')
    },
  })

  const toggleFeatureMutation = useMutation({
    mutationFn: ({ featureId, isEnabled }: { featureId: string; isEnabled: boolean }) =>
      serverUpdateTeamFeatureFlag({
        data: { teamId: teamId!, featureId, isEnabled }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-features', teamId] })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update feature')
    },
  })

  if (toolsLoading || featuresLoading) {
    return <div>Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tool Settings</h1>
        <p className="text-muted-foreground">
          Configure your team's tools and manage feature availability
        </p>
      </div>

      <Tabs defaultValue="tools" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tools">Tool Configuration</TabsTrigger>
          <TabsTrigger value="features">Feature Management</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-6">
            {tools?.data?.map((tool) => (
              <ToolSettingsForm
                key={tool.toolKey}
                tool={tool}
                onSave={(toolKey, settings) =>
                  updateSettingsMutation.mutate({ toolKey, settings })
                }
                onReset={(toolKey) => resetSettingsMutation.mutate(toolKey)}
              />
            ))}
          </div>

          {(!tools?.data || tools.data.length === 0) && (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tools available for configuration</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Enable or disable features for your team. Some features may require administrator approval.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {features?.data?.filter(f => f.scope === 'team').map((feature) => (
              <FeatureToggle
                key={feature.id}
                feature={feature}
                onToggle={(featureId, isEnabled) =>
                  toggleFeatureMutation.mutate({ featureId, isEnabled })
                }
              />
            ))}
          </div>

          {(!features?.data?.filter(f => f.scope === 'team').length) && (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No team-scoped features available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}