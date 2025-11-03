import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  serverBulkAddTags,
  serverBulkRemoveTags,
  serverBulkSetCategory,
  serverGetTags,
  serverGetCategories
} from '@/lib/server/links'
import { X, Tag as TagIcon, Folder } from 'lucide-react'

interface BulkTagCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'add-tag' | 'set-category'
  selectedLinkIds: string[]
  teamId: string
}

export function BulkTagCategoryDialog({
  open,
  onOpenChange,
  action,
  selectedLinkIds,
  teamId
}: BulkTagCategoryDialogProps) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  // Fetch tags and categories
  const { data: tagsData } = useQuery({
    queryKey: ['tags', teamId],
    queryFn: () => serverGetTags({ data: { teamId } }),
    staleTime: 5 * 60 * 1000,
    enabled: open && action === 'add-tag'
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', teamId],
    queryFn: () => serverGetCategories({ data: { teamId } }),
    staleTime: 5 * 60 * 1000,
    enabled: open && action === 'set-category'
  })

  const tags = tagsData?.data || []
  const categories = categoriesData?.data || []

  // Reset form when dialog opens or action changes
  useEffect(() => {
    if (open) {
      setSelectedTagIds([])
      setSelectedCategoryId('')
    }
  }, [open, action])

  const handleSubmit = async () => {
    if (selectedLinkIds.length === 0) {
      toast.error('No links selected')
      return
    }

    setIsSubmitting(true)
    try {
      if (action === 'add-tag') {
        if (selectedTagIds.length === 0) {
          toast.error('Please select at least one tag')
          setIsSubmitting(false)
          return
        }

        await serverBulkAddTags({
          data: {
            linkIds: selectedLinkIds,
            tagIds: selectedTagIds
          }
        })

        toast.success(`Tags added to ${selectedLinkIds.length} links successfully`)
      } else if (action === 'set-category') {
        await serverBulkSetCategory({
          data: {
            linkIds: selectedLinkIds,
            categoryId: selectedCategoryId === "none" ? undefined : selectedCategoryId || undefined
          }
        })

        toast.success(`Category updated for ${selectedLinkIds.length} links successfully`)
      }

      queryClient.invalidateQueries({ queryKey: ['links', teamId] })
      onOpenChange(false)
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error)
      toast.error(`Failed to complete bulk ${action}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTagToggle = (tagId: string, checked: boolean) => {
    if (checked) {
      setSelectedTagIds(prev => [...prev, tagId])
    } else {
      setSelectedTagIds(prev => prev.filter(id => id !== tagId))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'add-tag' ? (
              <>
                <TagIcon className="h-5 w-5" />
                Add Tags to Links
              </>
            ) : (
              <>
                <Folder className="h-5 w-5" />
                Set Category for Links
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {action === 'add-tag' 
              ? `Add tags to ${selectedLinkIds.length} selected link${selectedLinkIds.length !== 1 ? 's' : ''}`
              : `Set category for ${selectedLinkIds.length} selected link${selectedLinkIds.length !== 1 ? 's' : ''}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {action === 'add-tag' ? (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Select Tags</Label>
              {tags.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-md">
                  <TagIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No tags available</p>
                  <p className="text-xs text-muted-foreground mt-1">Create tags first to add them to links</p>
                </div>
              ) : (
                <ScrollArea className="h-48 border rounded-md p-2">
                  <div className="space-y-2">
                    {tags.map((tag: any) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={selectedTagIds.includes(tag.id)}
                          onCheckedChange={(checked) => handleTagToggle(tag.id, !!checked)}
                        />
                        <Label
                          htmlFor={`tag-${tag.id}`}
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: tag.color ? `${tag.color}20` : undefined,
                              borderColor: tag.color ? `${tag.color}40` : undefined,
                              color: tag.color || undefined
                            }}
                          >
                            {tag.name}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {selectedTagIds.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground">Selected: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTagIds.map(tagId => {
                      const tag = tags.find((t: any) => t.id === tagId)
                      return tag ? (
                        <Badge
                          key={tagId}
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: tag.color ? `${tag.color}20` : undefined,
                            borderColor: tag.color ? `${tag.color}40` : undefined,
                            color: tag.color || undefined
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Label htmlFor="category-select" className="text-sm font-medium">Select Category</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="Select a category (or leave empty to remove)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color || '#3b82f6' }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategoryId && selectedCategoryId !== "none" && (
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground">Selected: </span>
                  <Badge
                    variant="secondary"
                    className="text-xs mt-1"
                  >
                    {categories.find((c: any) => c.id === selectedCategoryId)?.name}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (action === 'add-tag' && selectedTagIds.length === 0)}
          >
            {isSubmitting ? 'Processing...' : action === 'add-tag' ? 'Add Tags' : 'Set Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}