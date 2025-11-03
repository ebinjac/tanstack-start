// components/turnover/turnover-form.tsx

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Users,
  FileText,
  AlertTriangle,
  Bell,
  Link as LinkIcon,
  Mail,
  MessageSquare,
  Plus,
  Clock,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MultiEntrySection } from './multi-entry-section'

// Types
interface TurnoverEntry {
  id: string
  entryType: 'rfc' | 'inc' | 'alert' | 'mim' | 'email_slack' | 'fyi'
  priority: 'normal' | 'important' | 'flagged' | 'needs_action' | 'long_pending'
  createdAt: Date
  updatedAt: Date
  // RFC fields
  rfcNumber?: string
  rfcStatus?: string
  rfcValidatedBy?: string
  rfcDescription?: string
  // INC fields
  incNumber?: string
  incidentDescription?: string
  // Alert fields
  alertsIssues?: string
  // MIM fields
  mimLink?: string
  mimSlackLink?: string
  // Email/Slack fields
  emailSubjectSlackLink?: string
  // FYI fields
  fyiInfo?: string
  // Common fields
  comments?: string
  // Sub-application tagging
  subApplicationId?: string
}

interface TurnoverFormData {
  id?: string
  handoverFrom: string
  handoverTo: string
  applicationId?: string
  subApplicationId?: string
  entries: TurnoverEntry[]
}

interface Application {
  id: string
  applicationName: string
}

interface SubApplication {
  id: string
  subApplicationName: string
}

interface TurnoverFormProps {
  teamId: string
  applications: Application[]
  subApplications: SubApplication[]
  initialData?: TurnoverFormData
  onSave: (data: TurnoverFormData) => void
  onCancel: () => void
  applicationId?: string
  subApplicationId?: string
}

const entryTypeConfig = {
  rfc: {
    label: 'RFC Section',
    icon: FileText,
    color: 'blue',
    fields: ['rfcNumber', 'rfcStatus', 'rfcValidatedBy', 'rfcDescription', 'comments']
  },
  inc: {
    label: 'INC Section', 
    icon: AlertTriangle,
    color: 'red',
    fields: ['incNumber', 'incidentDescription', 'comments']
  },
  alert: {
    label: 'Alerts Section',
    icon: Bell,
    color: 'orange',
    fields: ['alertsIssues', 'comments']
  },
  mim: {
    label: 'MIM Section',
    icon: LinkIcon,
    color: 'purple',
    fields: ['mimLink', 'mimSlackLink', 'comments']
  },
  email_slack: {
    label: 'Email / Slack Section',
    icon: Mail,
    color: 'green',
    fields: ['emailSubjectSlackLink', 'comments']
  },
  fyi: {
    label: 'FYI Section',
    icon: MessageSquare,
    color: 'gray',
    fields: ['fyiInfo', 'comments']
  }
}

const priorityConfig = {
  normal: { label: 'Normal', color: 'bg-gray-100 text-gray-800' },
  important: { label: 'Important', color: 'bg-blue-100 text-blue-800' },
  flagged: { label: 'Flagged', color: 'bg-orange-100 text-orange-800' },
  needs_action: { label: 'Needs Action', color: 'bg-red-100 text-red-800' },
  long_pending: { label: 'Long Pending', color: 'bg-purple-100 text-purple-800' }
}

export function TurnoverForm({
  teamId,
  applications,
  subApplications,
  initialData,
  onSave,
  onCancel,
  applicationId,
  subApplicationId
}: TurnoverFormProps) {
  const [formData, setFormData] = useState<TurnoverFormData>({
    handoverFrom: initialData?.handoverFrom || '',
    handoverTo: initialData?.handoverTo || '',
    applicationId: initialData?.applicationId || '',
    subApplicationId: initialData?.subApplicationId || '',
    entries: initialData?.entries || []
  })

  const [selectedApplication, setSelectedApplication] = useState<string>(
    applicationId || initialData?.applicationId || ''
  )

  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TurnoverEntry | null>(null)
  const [selectedEntryType, setSelectedEntryType] = useState<TurnoverEntry['entryType']>('rfc')

  // Filter sub-applications based on selected application
  const filteredSubApplications = subApplications.filter(
    sub => !selectedApplication || sub.id === selectedApplication
  )

  const handleSave = () => {
    onSave(formData)
  }

  const handleAddEntry = (entryType: TurnoverEntry['entryType']) => {
    setSelectedEntryType(entryType)
    setEditingEntry(null)
    setIsEntryDialogOpen(true)
  }

  const handleEditEntry = (entry: TurnoverEntry) => {
    setEditingEntry(entry)
    setSelectedEntryType(entry.entryType)
    setIsEntryDialogOpen(true)
  }

  const handleDeleteEntry = (entryId: string) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.filter(entry => entry.id !== entryId)
    }))
  }

  const handleSaveEntry = (entryData: Partial<TurnoverEntry>) => {
    if (editingEntry) {
      // Update existing entry
      setFormData(prev => ({
        ...prev,
        entries: prev.entries.map(entry =>
          entry.id === editingEntry.id
            ? { ...entry, ...entryData, updatedAt: new Date() }
            : entry
        )
      }))
    } else {
      // Add new entry
      const newEntry: TurnoverEntry = {
        id: crypto.randomUUID(),
        entryType: selectedEntryType,
        priority: 'normal',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...entryData
      }
      setFormData(prev => ({
        ...prev,
        entries: [...prev.entries, newEntry]
      }))
    }
    setIsEntryDialogOpen(false)
    setEditingEntry(null)
  }

  const getEntriesByType = (type: TurnoverEntry['entryType']) => {
    return formData.entries.filter(entry => entry.entryType === type)
  }

  const getPriorityBadge = (priority: TurnoverEntry['priority']) => {
    const config = priorityConfig[priority]
    return <Badge className={config.color}>{config.label}</Badge>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Handover Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Handover Details
          </CardTitle>
          <CardDescription>
            Enter the details of the handover between team members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="handoverFrom">Handover From</Label>
              <Input
                id="handoverFrom"
                value={formData.handoverFrom}
                onChange={(e) => setFormData(prev => ({ ...prev, handoverFrom: e.target.value }))}
                placeholder="Name of outgoing person"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handoverTo">Handover To</Label>
              <Input
                id="handoverTo"
                value={formData.handoverTo}
                onChange={(e) => setFormData(prev => ({ ...prev, handoverTo: e.target.value }))}
                placeholder="Name of incoming person"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="application">Application</Label>
            <Select
              value={selectedApplication}
              onValueChange={(value) => {
                setSelectedApplication(value)
                setFormData(prev => ({
                  ...prev,
                  applicationId: value === 'none' ? undefined : value,
                  subApplicationId: '' // Reset sub-application when application changes
                }))
              }}
              disabled={!!applicationId} // Disable if application is pre-selected
            >
              <SelectTrigger>
                <SelectValue placeholder="Select application" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Application</SelectItem>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.applicationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Entry Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Turnover Entries</CardTitle>
          <CardDescription>
            Add entries for different sections of the turnover
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rfc" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              {Object.entries(entryTypeConfig).map(([type, config]) => (
                <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                  <config.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(entryTypeConfig).map(([type, config]) => {
              return (
                <TabsContent key={type} value={type} className="space-y-4">
                  <MultiEntrySection
                    entryType={type as TurnoverEntry['entryType']}
                    entries={formData.entries}
                    onAddEntry={(entryData) => {
                      const newEntry: TurnoverEntry = {
                        id: crypto.randomUUID(),
                        entryType: type as TurnoverEntry['entryType'],
                        priority: 'normal',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        ...entryData
                      }
                      setFormData(prev => ({
                        ...prev,
                        entries: [...prev.entries, newEntry]
                      }))
                    }}
                    onUpdateEntry={(id, entryData) => {
                      setFormData(prev => ({
                        ...prev,
                        entries: prev.entries.map(entry =>
                          entry.id === id
                            ? { ...entry, ...entryData, updatedAt: new Date() }
                            : entry
                        )
                      }))
                    }}
                    onDeleteEntry={(id) => {
                      setFormData(prev => ({
                        ...prev,
                        entries: prev.entries.filter(entry => entry.id !== id)
                      }))
                    }}
                    subApplications={subApplications || []}
                    applicationId={selectedApplication}
                  />
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Save Turnover
        </Button>
      </div>

      {/* Entry Dialog */}
      <EntryDialog
        isOpen={isEntryDialogOpen}
        onClose={() => setIsEntryDialogOpen(false)}
        entryType={selectedEntryType}
        entry={editingEntry}
        onSave={handleSaveEntry}
      />
    </motion.div>
  )
}

// Entry Dialog Component
interface EntryDialogProps {
  isOpen: boolean
  onClose: () => void
  entryType: TurnoverEntry['entryType']
  entry?: TurnoverEntry | null
  onSave: (data: Partial<TurnoverEntry>) => void
}

function EntryDialog({ isOpen, onClose, entryType, entry, onSave }: EntryDialogProps) {
  const [formData, setFormData] = useState<Partial<TurnoverEntry>>({
    priority: 'normal',
    ...entry
  })

  const config = entryTypeConfig[entryType]

  const handleSave = () => {
    onSave(formData)
  }

  const renderFields = () => {
    switch (entryType) {
      case 'rfc':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="rfcNumber">RFC Number</Label>
              <Input
                id="rfcNumber"
                value={formData.rfcNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, rfcNumber: e.target.value }))}
                placeholder="Enter RFC number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfcStatus">Status</Label>
              <Input
                id="rfcStatus"
                value={formData.rfcStatus || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, rfcStatus: e.target.value }))}
                placeholder="Enter RFC status"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfcValidatedBy">Validated By</Label>
              <Input
                id="rfcValidatedBy"
                value={formData.rfcValidatedBy || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, rfcValidatedBy: e.target.value }))}
                placeholder="Enter validator name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfcDescription">RFC Description</Label>
              <Textarea
                id="rfcDescription"
                value={formData.rfcDescription || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, rfcDescription: e.target.value }))}
                placeholder="Enter RFC description"
                rows={3}
              />
            </div>
          </>
        )
      case 'inc':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="incNumber">INC Number</Label>
              <Input
                id="incNumber"
                value={formData.incNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, incNumber: e.target.value }))}
                placeholder="Enter INC number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incidentDescription">Incident Description</Label>
              <Textarea
                id="incidentDescription"
                value={formData.incidentDescription || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, incidentDescription: e.target.value }))}
                placeholder="Enter incident description"
                rows={3}
              />
            </div>
          </>
        )
      case 'alert':
        return (
          <div className="space-y-2">
            <Label htmlFor="alertsIssues">Alerts / Issues</Label>
            <Textarea
              id="alertsIssues"
              value={formData.alertsIssues || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, alertsIssues: e.target.value }))}
              placeholder="Enter alerts or issues"
              rows={3}
            />
          </div>
        )
      case 'mim':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="mimLink">MIM Link</Label>
              <Input
                id="mimLink"
                value={formData.mimLink || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, mimLink: e.target.value }))}
                placeholder="Enter MIM link"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mimSlackLink">MIM Slack Link</Label>
              <Input
                id="mimSlackLink"
                value={formData.mimSlackLink || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, mimSlackLink: e.target.value }))}
                placeholder="Enter MIM Slack link"
              />
            </div>
          </>
        )
      case 'email_slack':
        return (
          <div className="space-y-2">
            <Label htmlFor="emailSubjectSlackLink">Email Subject / Slack Link</Label>
            <Input
              id="emailSubjectSlackLink"
              value={formData.emailSubjectSlackLink || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, emailSubjectSlackLink: e.target.value }))}
              placeholder="Enter email subject or Slack link"
            />
          </div>
        )
      case 'fyi':
        return (
          <div className="space-y-2">
            <Label htmlFor="fyiInfo">FYI Information</Label>
            <Textarea
              id="fyiInfo"
              value={formData.fyiInfo || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, fyiInfo: e.target.value }))}
              placeholder="Enter FYI information"
              rows={3}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <config.icon className="h-5 w-5" />
            {entry ? 'Edit Entry' : 'Add Entry'} - {config.label}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                priority: value as TurnoverEntry['priority']
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {renderFields()}

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={formData.comments || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Enter additional comments"
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {entry ? 'Update' : 'Add'} Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}