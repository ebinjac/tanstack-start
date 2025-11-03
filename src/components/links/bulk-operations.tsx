import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import {
  MoreHorizontal,
  Trash2,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Copy,
  Download,
  Tag as TagIcon,
  Folder
} from 'lucide-react'
import { toast } from 'sonner'
import { BulkTagCategoryDialog } from './bulk-tag-category-dialog'

interface BulkOperationsProps {
  selectedLinks: string[]
  allLinks: any[]
  onSelectLink: (linkId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onBulkAction: (action: string, linkIds: string[]) => void
  teamId: string
}

export function BulkOperations({
  selectedLinks,
  allLinks,
  onSelectLink,
  onSelectAll,
  onBulkAction,
  teamId
}: BulkOperationsProps) {
  const [isAllSelected, setIsAllSelected] = useState(false)
  const [isIndeterminate, setIsIndeterminate] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)

  // Update checkbox states when selection changes
  useEffect(() => {
    if (selectedLinks.length === 0) {
      setIsAllSelected(false)
      setIsIndeterminate(false)
    } else if (selectedLinks.length === allLinks.length) {
      setIsAllSelected(true)
      setIsIndeterminate(false)
    } else {
      setIsAllSelected(false)
      setIsIndeterminate(true)
    }
  }, [selectedLinks, allLinks])

  const handleSelectAll = (checked: boolean) => {
    setIsAllSelected(checked)
    setIsIndeterminate(false)
    onSelectAll(checked)
  }

  const handleBulkAction = async (action: string) => {
    if (selectedLinks.length === 0) {
      toast.error('No links selected')
      return
    }

    try {
      await onBulkAction(action, selectedLinks)
      
      // Show success message based on action
      const actionMessages: Record<string, string> = {
        'delete': `${selectedLinks.length} links deleted successfully`,
        'pin': `${selectedLinks.length} links pinned successfully`,
        'unpin': `${selectedLinks.length} links unpinned successfully`,
        'public': `${selectedLinks.length} links made public successfully`,
        'private': `${selectedLinks.length} links made private successfully`,
        'archive': `${selectedLinks.length} links archived successfully`,
        'copy': `${selectedLinks.length} link URLs copied to clipboard`,
      }

      toast.success(actionMessages[action] || `Bulk ${action} completed successfully`)
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error)
      toast.error(`Failed to complete bulk ${action}`)
    }
  }

  const handleCopyUrls = async () => {
    const selectedLinkData = allLinks.filter(link => selectedLinks.includes(link.id))
    const urls = selectedLinkData.map(link => link.originalUrl).join('\n')
    
    try {
      await navigator.clipboard.writeText(urls)
      toast.success(`${selectedLinks.length} URLs copied to clipboard`)
    } catch (error) {
      console.error('Failed to copy URLs:', error)
      toast.error('Failed to copy URLs to clipboard')
    }
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Header */}
      {selectedLinks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-secondary border border-secondary rounded-lg"
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedLinks.length} link{selectedLinks.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrls}
              className="h-8"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy URLs
            </Button>

            {/* Bulk Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <MoreHorizontal className="h-3 w-3 mr-1" />
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Pin/Unpin */}
                <DropdownMenuItem onClick={() => handleBulkAction('pin')}>
                  <Pin className="h-4 w-4 mr-2" />
                  Pin Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('unpin')}>
                  <PinOff className="h-4 w-4 mr-2" />
                  Unpin Selected
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Visibility */}
                <DropdownMenuItem onClick={() => handleBulkAction('public')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Make Public
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('private')}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Make Private
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Organize */}
                <DropdownMenuItem onClick={() => setIsTagDialogOpen(true)}>
                  <TagIcon className="h-4 w-4 mr-2" />
                  Add Tag
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCategoryDialogOpen(true)}>
                  <Folder className="h-4 w-4 mr-2" />
                  Set Category
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Export */}
                <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Destructive Actions */}
                <DropdownMenuItem 
                  onClick={() => handleBulkAction('archive')}
                  className="text-yellow-600"
                >
                  Archive Selected
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleBulkAction('delete')}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectAll(false)}
              className="h-8"
            >
              Clear
            </Button>
          </div>
        </motion.div>
      )}

      {/* Select All Checkbox (when no items are selected) */}
      {selectedLinks.length === 0 && allLinks.length > 0 && (
        <div className="flex items-center p-2">
          <Checkbox
            checked={false}
            onCheckedChange={handleSelectAll}
          />
          <span className="ml-2 text-sm text-muted-foreground">
            Select all links
          </span>
        </div>
      )}

      {/* Bulk Tag Dialog */}
      <BulkTagCategoryDialog
        open={isTagDialogOpen}
        onOpenChange={setIsTagDialogOpen}
        action="add-tag"
        selectedLinkIds={selectedLinks}
        teamId={teamId}
      />

      {/* Bulk Category Dialog */}
      <BulkTagCategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        action="set-category"
        selectedLinkIds={selectedLinks}
        teamId={teamId}
      />
    </div>
  )
}

interface LinkCheckboxProps {
  linkId: string
  isSelected: boolean
  onSelect: (linkId: string, selected: boolean) => void
}

export function LinkCheckbox({ linkId, isSelected, onSelect }: LinkCheckboxProps) {
  return (
    <div className="absolute top-2 right-2 z-10">
      <div className="bg-background/95 backdrop-blur-sm rounded-md p-1 shadow-sm border border-border/50">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(linkId, !!checked)}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>
    </div>
  )
}