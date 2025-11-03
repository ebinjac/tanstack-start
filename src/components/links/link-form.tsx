import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Link2,
  Plus,
  X,
  Eye,
  EyeOff,
  Users,
  Folder,
  Tag,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import {
  serverCreateLink,
  serverUpdateLink,
  serverGetCategories,
  serverGetTags,
  serverGetApplications,
  serverCreateTag,
  CreateLinkInput,
  UpdateLinkInput
} from '@/lib/server/links'

// Form validation schema
const LinkFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  originalUrl: z.string().url('Please enter a valid URL'),
  shortUrl: z.string().optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  categoryId: z.string().optional(),
  applicationId: z.string().optional(),
  visibility: z.enum(['team', 'private']),
  status: z.enum(['active', 'inactive', 'archived']),
  isPinned: z.boolean(),
  tagIds: z.array(z.string().uuid()),
})

type LinkFormValues = z.infer<typeof LinkFormSchema>

interface LinkFormProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  link?: any // For editing existing link
  onSuccess?: (link: any) => void
}

export function LinkForm({ teamId, open, onOpenChange, link, onSuccess }: LinkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [showNewTagInput, setShowNewTagInput] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>(link?.tags?.map((t: any) => t.id) || [])

  const isEditing = !!link

  const form = useForm<LinkFormValues>({
    resolver: zodResolver(LinkFormSchema),
    defaultValues: {
      title: link?.title || '',
      originalUrl: link?.originalUrl || '',
      shortUrl: link?.shortUrl || '',
      description: link?.description || '',
      categoryId: link?.categoryId || '',
      applicationId: link?.applicationId || '',
      visibility: link?.visibility || 'team',
      status: link?.status || 'active',
      isPinned: link?.isPinned || false,
      tagIds: selectedTags,
    },
    mode: 'onBlur', // Validate on blur to see errors earlier
  })

  // Add form state debugging
  const formState = form.formState
  useEffect(() => {
    console.log('Form errors:', formState.errors)
  }, [formState.errors])

  // Fetch categories, tags, and applications when dialog opens
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [categoriesRes, tagsRes, applicationsRes] = await Promise.all([
            serverGetCategories({ data: { teamId } }),
            serverGetTags({ data: { teamId } }),
            serverGetApplications({ data: { teamId } })
          ])
          setCategories(categoriesRes.data || [])
          setTags(tagsRes.data || [])
          setApplications(applicationsRes.data || [])
        } catch (error) {
          console.error('Failed to fetch data:', error)
        }
      }
      fetchData()
    }
  }, [open, teamId])

  // Update form when link prop changes
  useEffect(() => {
    if (link) {
      form.reset({
        title: link.title,
        originalUrl: link.originalUrl,
        shortUrl: link.shortUrl || '',
        description: link.description || '',
        categoryId: link.categoryId || '',
        applicationId: link.applicationId || '',
        visibility: link.visibility,
        status: link.status,
        isPinned: link.isPinned,
        tagIds: selectedTags,
      })
    }
  }, [link, form, selectedTags])

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
      
      form.setValue('tagIds', newTags)
      return newTags
    })
  }

  const handleAddNewTag = async () => {
    if (!newTagName.trim()) return

    try {
      // Create the tag in the database
      const tagData = {
        name: newTagName.trim(),
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        teamId,
      }

      const result = await serverCreateTag({ data: tagData })
      
      if (result.success) {
        const newTag = result.data
        setTags(prev => [...prev, newTag])
        setSelectedTags(prev => [...prev, newTag.id])
        form.setValue('tagIds', [...selectedTags, newTag.id])
        setNewTagName('')
        setShowNewTagInput(false)
      } else {
        console.error('Failed to create tag:', result.message)
        alert(`Error creating tag: ${result.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create tag:', error)
      alert(`Error creating tag: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const onSubmit = async (values: LinkFormValues) => {
    console.log('Form submitted with values:', values)
    console.log('Selected tags:', selectedTags)
    setIsSubmitting(true)
    try {
      // Filter out any invalid tag IDs (defensive programming)
      const validTagIds = selectedTags.filter(tagId => {
        // Basic UUID validation - check if it matches UUID pattern
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(tagId)
      })

      console.log('Valid tag IDs:', validTagIds)

      // Process the form data to handle empty values
      const processedData = {
        ...values,
        // Convert empty strings to null/undefined for optional fields
        shortUrl: values.shortUrl || undefined,
        description: values.description || undefined,
        categoryId: values.categoryId && values.categoryId !== "none" ? values.categoryId : undefined,
        applicationId: values.applicationId && values.applicationId !== "none" ? values.applicationId : undefined,
      }

      const linkData = {
        ...processedData,
        teamId,
        tagIds: validTagIds,
      }

      console.log('Link data to be sent:', linkData)

      let result
      if (isEditing) {
        console.log('Updating link with ID:', link.id)
        result = await serverUpdateLink({
          data: {
            ...linkData,
            id: link.id
          }
        })
      } else {
        console.log('Creating new link')
        result = await serverCreateLink({
          data: linkData
        })
      }

      console.log('Server response:', result)

      if (result.success) {
        console.log('Link saved successfully')
        onSuccess?.(result.data)
        onOpenChange(false)
        form.reset()
        setSelectedTags([])
      } else {
        console.error('Server returned error:', result)
        // Show error message to user
        alert(`Error: ${result.message || 'Failed to save link'}`)
      }
    } catch (error) {
      console.error('Failed to save link:', error)
      // Show error message to user
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save link'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getVisibilityIcon = () => {
    const visibility = form.watch('visibility')
    switch (visibility) {
      case 'team':
        return <Users className="h-4 w-4" />
      case 'private':
        return <EyeOff className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getVisibilityDescription = () => {
    const visibility = form.watch('visibility')
    switch (visibility) {
      case 'private':
        return 'Only visible to you'
      default:
        return 'Visible to all team members'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {isEditing ? 'Edit Link' : 'Create New Link'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the link details and settings'
              : 'Add a new link to your collection'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => {
            console.log('Form handleSubmit called with:', data)
            onSubmit(data)
          })} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter link title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="originalUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this link"
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Organization */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} defaultValue={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applicationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} defaultValue={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {applications.map((app) => (
                            <SelectItem key={app.id} value={app.id}>
                              {app.tla}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                  ))}
                  {showNewTagInput ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Tag name"
                        className="h-8 w-32"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddNewTag()
                          } else if (e.key === 'Escape') {
                            setShowNewTagInput(false)
                            setNewTagName('')
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={handleAddNewTag}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setShowNewTagInput(false)
                          setNewTagName('')
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setShowNewTagInput(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Tag
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="team">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Team
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <EyeOff className="h-4 w-4" />
                            Private
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="flex items-center gap-2 text-xs">
                      {getVisibilityIcon()}
                      {getVisibilityDescription()}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Pin this link</FormLabel>
                    <FormDescription className="text-xs">
                      Pinned links appear at the top of the list
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? 'Update Link' : 'Create Link'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}