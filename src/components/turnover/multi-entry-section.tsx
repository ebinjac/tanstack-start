// components/turnover/multi-entry-section.tsx

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Flag, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  Bell,
  Mail,
  Link as LinkIcon,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface MultiEntrySectionProps {
  entryType: TurnoverEntry['entryType']
  entries: TurnoverEntry[]
  onAddEntry: (entry: Partial<TurnoverEntry>) => void
  onUpdateEntry: (id: string, entry: Partial<TurnoverEntry>) => void
  onDeleteEntry: (id: string) => void
  readOnly?: boolean
  subApplications?: Array<{
    id: string
    subApplicationName: string
  }>
  applicationId?: string
}

const entryTypeConfig = {
  rfc: {
    label: 'RFC Section',
    icon: FileText,
    color: 'blue',
    description: 'Request for Change items',
    fields: [
      { key: 'rfcNumber', label: 'RFC Number', type: 'text', required: true },
      { key: 'rfcStatus', label: 'Status', type: 'text', required: false },
      { key: 'rfcValidatedBy', label: 'Validated By', type: 'text', required: false },
      { key: 'rfcDescription', label: 'Description', type: 'textarea', required: false },
      { key: 'comments', label: 'Comments', type: 'textarea', required: false }
    ]
  },
  inc: {
    label: 'INC Section', 
    icon: AlertTriangle,
    color: 'red',
    description: 'Incident reports',
    fields: [
      { key: 'incNumber', label: 'INC Number', type: 'text', required: true },
      { key: 'incidentDescription', label: 'Description', type: 'textarea', required: false },
      { key: 'comments', label: 'Comments', type: 'textarea', required: false }
    ]
  },
  alert: {
    label: 'Alerts Section',
    icon: Bell,
    color: 'orange',
    description: 'Alerts and issues',
    fields: [
      { key: 'alertsIssues', label: 'Alerts/Issues', type: 'textarea', required: true },
      { key: 'comments', label: 'Comments', type: 'textarea', required: false }
    ]
  },
  mim: {
    label: 'MIM Section',
    icon: LinkIcon,
    color: 'purple',
    description: 'Meeting minutes and memos',
    fields: [
      { key: 'mimLink', label: 'MIM Link', type: 'text', required: false },
      { key: 'mimSlackLink', label: 'Slack Link', type: 'text', required: false },
      { key: 'comments', label: 'Comments', type: 'textarea', required: false }
    ]
  },
  email_slack: {
    label: 'Email / Slack Section',
    icon: Mail,
    color: 'green',
    description: 'Email threads and Slack conversations',
    fields: [
      { key: 'emailSubjectSlackLink', label: 'Subject/Link', type: 'text', required: true },
      { key: 'comments', label: 'Comments', type: 'textarea', required: false }
    ]
  },
  fyi: {
    label: 'FYI Section',
    icon: MessageSquare,
    color: 'gray',
    description: 'For your information items',
    fields: [
      { key: 'fyiInfo', label: 'Information', type: 'textarea', required: true },
      { key: 'comments', label: 'Comments', type: 'textarea', required: false }
    ]
  }
}

const priorityConfig = {
  normal: { label: 'Normal', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  important: { label: 'Important', color: 'bg-blue-100 text-blue-800', icon: Flag },
  flagged: { label: 'Flagged', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  needs_action: { label: 'Needs Action', color: 'bg-red-100 text-red-800', icon: Clock },
  long_pending: { label: 'Long Pending', color: 'bg-purple-100 text-purple-800', icon: Clock }
}

export function MultiEntrySection({
  entryType,
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  readOnly = false,
  subApplications = [],
  applicationId
}: MultiEntrySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TurnoverEntry | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const config = entryTypeConfig[entryType]
  const Icon = config.icon

  const filteredEntries = entries.filter(entry => entry.entryType === entryType)
  const flaggedEntries = filteredEntries.filter(entry => 
    entry.priority === 'flagged' || entry.priority === 'needs_action' || entry.priority === 'long_pending'
  )

  const handleAddEntry = () => {
    if (readOnly) return
    setEditingEntry(null)
    setIsEntryDialogOpen(true)
  }

  const handleEditEntry = (entry: TurnoverEntry) => {
    if (readOnly) return
    setEditingEntry(entry)
    setIsEntryDialogOpen(true)
  }

  const handleDeleteEntry = (id: string) => {
    if (readOnly) return
    onDeleteEntry(id)
  }

  const handleSaveEntry = (entryData: Partial<TurnoverEntry>) => {
    if (editingEntry) {
      // Update existing entry
      onUpdateEntry(editingEntry.id, {
        ...entryData,
        updatedAt: new Date()
      })
    } else {
      // Add new entry
      onAddEntry({
        entryType,
        priority: 'normal',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...entryData
      })
    }
    setIsEntryDialogOpen(false)
    setEditingEntry(null)
  }

  const getPriorityBadge = (priority: TurnoverEntry['priority']) => {
    const config = priorityConfig[priority]
    const Icon = config.icon
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getSubApplicationName = (subApplicationId: string) => {
    const subApp = subApplications.find(sub => sub.id === subApplicationId)
    return subApp ? subApp.subApplicationName : 'Unknown'
  }

  const getEntrySummary = (entry: TurnoverEntry) => {
    switch (entry.entryType) {
      case 'rfc':
        return `${entry.rfcNumber || 'No RFC Number'}${entry.rfcStatus ? ` - ${entry.rfcStatus}` : ''}`
      case 'inc':
        return entry.incNumber || 'No INC Number'
      case 'alert':
        return entry.alertsIssues?.substring(0, 50) + (entry.alertsIssues?.length && entry.alertsIssues.length > 50 ? '...' : '') || 'No alert details'
      case 'mim':
        return entry.mimLink || entry.mimSlackLink || 'No MIM link'
      case 'email_slack':
        return entry.emailSubjectSlackLink || 'No subject/link'
      case 'fyi':
        return entry.fyiInfo?.substring(0, 50) + (entry.fyiInfo?.length && entry.fyiInfo.length > 50 ? '...' : '') || 'No FYI details'
      default:
        return 'No details available'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Section Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                entryType === 'rfc' && "bg-blue-100 text-blue-600",
                entryType === 'inc' && "bg-red-100 text-red-600",
                entryType === 'alert' && "bg-orange-100 text-orange-600",
                entryType === 'mim' && "bg-purple-100 text-purple-600",
                entryType === 'email_slack' && "bg-green-100 text-green-600",
                entryType === 'fyi' && "bg-gray-100 text-gray-600"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{config.label}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {flaggedEntries.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {flaggedEntries.length} flagged
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {filteredEntries.length} items
              </Badge>
              {!readOnly && (
                <Button size="sm" onClick={handleAddEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Section Content */}
        {isExpanded && (
          <CardContent className="pt-0">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No {config.label} Entries</h3>
                <p className="text-gray-600 mb-6">
                  There are no entries in this section yet.
                </p>
                {!readOnly && (
                  <Button onClick={handleAddEntry}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Entry
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* View Mode Toggle */}
                <div className="flex justify-end mb-4">
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-md">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="h-8"
                    >
                      Table
                    </Button>
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                      className="h-8"
                    >
                      Cards
                    </Button>
                  </div>
                </div>

                {/* Table View */}
                {viewMode === 'table' && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Details</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Last Updated</TableHead>
                          {!readOnly && <TableHead className="w-[100px]">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {getEntrySummary(entry)}
                                </div>
                                {entry.comments && (
                                  <div className="text-sm text-gray-600">
                                    {entry.comments.substring(0, 50)}{entry.comments.length > 50 ? '...' : ''}
                                  </div>
                                )}
                                {entry.subApplicationId && (
                                  <div className="mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {getSubApplicationName(entry.subApplicationId)}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getPriorityBadge(entry.priority)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="h-3 w-3" />
                                {new Date(entry.updatedAt).toLocaleString()}
                              </div>
                            </TableCell>
                            {!readOnly && (
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditEntry(entry)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEntry(entry.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Cards View */}
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredEntries.map((entry) => (
                      <Card key={entry.id} className={cn(
                        "border-l-4",
                        entry.priority === 'needs_action' && "border-l-red-500",
                        entry.priority === 'long_pending' && "border-l-purple-500",
                        entry.priority === 'flagged' && "border-l-orange-500",
                        entry.priority === 'important' && "border-l-blue-500"
                      )}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">
                              {entry.entryType === 'rfc' && entry.rfcNumber}
                              {entry.entryType === 'inc' && entry.incNumber}
                              {!(entry.entryType === 'rfc' || entry.entryType === 'inc') && (
                                <span className="capitalize">{entry.entryType.replace('_', ' ')}</span>
                              )}
                            </div>
                            {getPriorityBadge(entry.priority)}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {entry.entryType === 'rfc' && (
                              <>
                                {entry.rfcStatus && (
                                  <div className="text-sm">
                                    <span className="font-medium">Status:</span> {entry.rfcStatus}
                                  </div>
                                )}
                                {entry.rfcValidatedBy && (
                                  <div className="text-sm">
                                    <span className="font-medium">Validated by:</span> {entry.rfcValidatedBy}
                                  </div>
                                )}
                                {entry.rfcDescription && (
                                  <div className="text-sm">
                                    <span className="font-medium">Description:</span> {entry.rfcDescription}
                                  </div>
                                )}
                              </>
                            )}
                            {entry.entryType === 'inc' && entry.incidentDescription && (
                              <div className="text-sm">
                                <span className="font-medium">Description:</span> {entry.incidentDescription}
                              </div>
                            )}
                            {entry.entryType === 'alert' && entry.alertsIssues && (
                              <div className="text-sm">
                                <span className="font-medium">Alert:</span> {entry.alertsIssues}
                              </div>
                            )}
                            {entry.entryType === 'mim' && (
                              <div className="space-y-1">
                                {entry.mimLink && (
                                  <div className="text-sm">
                                    <span className="font-medium">MIM:</span> {entry.mimLink}
                                  </div>
                                )}
                                {entry.mimSlackLink && (
                                  <div className="text-sm">
                                    <span className="font-medium">Slack:</span> {entry.mimSlackLink}
                                  </div>
                                )}
                              </div>
                            )}
                            {entry.entryType === 'email_slack' && entry.emailSubjectSlackLink && (
                              <div className="text-sm">
                                <span className="font-medium">Subject/Link:</span> {entry.emailSubjectSlackLink}
                              </div>
                            )}
                            {entry.entryType === 'fyi' && entry.fyiInfo && (
                              <div className="text-sm">
                                <span className="font-medium">Information:</span> {entry.fyiInfo}
                              </div>
                            )}
                            {entry.comments && (
                              <div className="text-sm p-2 bg-gray-50 rounded">
                                <span className="font-medium">Comments:</span> {entry.comments}
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-2">
                              <div className="text-xs text-gray-500">
                                Updated: {new Date(entry.updatedAt).toLocaleString()}
                              </div>
                              {!readOnly && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditEntry(entry)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEntry(entry.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Entry Dialog */}
      <EntryDialog
        isOpen={isEntryDialogOpen}
        onClose={() => setIsEntryDialogOpen(false)}
        entryType={entryType}
        entry={editingEntry}
        onSave={handleSaveEntry}
        fields={config.fields as Array<{
          key: string
          label: string
          type: 'text' | 'textarea'
          required?: boolean
        }>}
        subApplications={subApplications}
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
  fields: Array<{ 
    key: string
    label: string
    type: 'text' | 'textarea'
    required?: boolean
  }>
}

function EntryDialog({ isOpen, onClose, entryType, entry, onSave, fields, subApplications }: EntryDialogProps & { subApplications?: any[] }) {
  const [formData, setFormData] = useState<Partial<TurnoverEntry>>({
    priority: 'normal',
    ...entry
  })

  const config = entryTypeConfig[entryType]

  const handleSave = () => {
    // Validate required fields
    const missingRequired = fields
      .filter(field => field.required)
      .some(field => !formData[field.key as keyof TurnoverEntry])

    if (missingRequired) {
      return
    }

    onSave(formData)
  }

  const renderField = (field: typeof fields[0]) => {
    const value = formData[field.key as keyof TurnoverEntry] || ''
    
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.key}
            value={value as string}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={`Enter ${field.label}`}
          />
        )
      case 'textarea':
        return (
          <Textarea
            id={field.key}
            value={value as string}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={`Enter ${field.label}`}
            rows={3}
          />
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
          {subApplications && Array.isArray(subApplications) && subApplications.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subApplication">Sub-Application</Label>
              <Select
                value={formData.subApplicationId || ''}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  subApplicationId: value === 'none' ? undefined : value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-application" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Sub-Application</SelectItem>
                  {subApplications.map((sub: any) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.subApplicationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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

          {fields.map(field => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              {renderField(field)}
            </div>
          ))}
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