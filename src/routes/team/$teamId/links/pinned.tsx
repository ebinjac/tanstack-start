import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuthContext } from '@/contexts/auth-context'
import { LinkCard } from '@/components/links/link-card'
import { BulkOperations, LinkCheckbox } from '@/components/links/bulk-operations'
import { LinkForm } from '@/components/links/link-form'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  serverGetPinnedLinks,
  serverSearchLinks,
  serverDeleteLink,
  serverRecordLinkAccess,
  serverGetCategories,
  serverBulkUpdateLinks,
  serverBulkDeleteLinks
} from '@/lib/server/links'
import {
  Link2,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Grid,
  List,
  Search,
  Filter,
  ChevronDown,
  X,
  Folder,
  Building2,
  Globe,
  Pin
} from 'lucide-react'

export const Route = createFileRoute('/team/$teamId/links/pinned')({
  component: PinnedLinksPage,
})

function PinnedLinksPage() {
  const { teams, currentTeam } = useAuthContext()
  const { teamId } = Route.useParams()
  const queryClient = useQueryClient()
  const [editingLink, setEditingLink] = useState<any>(null)
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedLinks, setSelectedLinks] = useState<string[]>([])
  const [showBulkOperations, setShowBulkOperations] = useState(false)

  // Filter states
  const [filters, setFilters] = useState({
    categoryId: 'all',
    applicationId: 'all',
    visibility: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // Get categories for filters
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', teamId],
    queryFn: () => serverGetCategories({ data: { teamId } }),
    staleTime: 5 * 60 * 1000,
  })

  const categories = categoriesData?.data || []

  // Fetch applications for the current team
  const { data: applicationsData, isLoading: isLoadingApps } = useQuery({
    queryKey: ['applications', teamId],
    queryFn: async () => {
      const { serverGetApplications } = await import('@/lib/server/links')
      return serverGetApplications({ data: { teamId } })
    },
    staleTime: 5 * 60 * 1000,
  })

  const applications = applicationsData?.data || []

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Determine if we should use search or regular query
  const useSearch = isSearchActive || Object.values(filters).some(value => value !== 'all' && value !== 'createdAt' && value !== 'desc')

  // Memoize search parameters to prevent unnecessary re-renders
  const searchParams = useMemo(() => ({
    teamId,
    ...(isSearchActive && debouncedSearchQuery && { search: debouncedSearchQuery }),
    ...(filters.categoryId !== 'all' && { categoryId: filters.categoryId }),
    ...(filters.applicationId !== 'all' && { applicationId: filters.applicationId }),
    ...(filters.visibility !== 'all' && { visibility: filters.visibility as 'team' | 'private' }),
    ...(filters.status !== 'all' && { status: filters.status as 'active' | 'inactive' | 'archived' }),
    isPinned: true, // Always filter for pinned links
    sortBy: filters.sortBy as 'createdAt' | 'updatedAt' | 'title' | 'clickCount' | 'lastAccessedAt',
    sortOrder: filters.sortOrder as 'asc' | 'desc'
  }), [teamId, isSearchActive, debouncedSearchQuery, filters])

  // Fetch pinned links
  const { data: linksData, isLoading, isFetching } = useQuery({
    queryKey: ['links', teamId, 'pinned', useSearch, searchParams],
    queryFn: () => {
      // If search or filters are active, use search function
      if (useSearch) {
        return serverSearchLinks({ data: searchParams })
      }
      // Otherwise use regular query for pinned links
      return serverGetPinnedLinks({ data: { teamId } })
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const links = linksData?.data || []

  // Get current team from teams array
  const currentTeamData = teams.find(team => team.id === teamId)

  if (!currentTeamData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Team Not Found</h1>
            <p className="text-muted-foreground">The team you're looking for doesn't exist or you don't have access.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  const handleRecordClick = async (linkId: string) => {
    try {
      await serverRecordLinkAccess({ data: { linkId } })
    } catch (error) {
      console.error('Failed to record link access:', error)
    }
  }

  const handleEditLink = (link: any) => {
    setEditingLink(link)
  }

  const handleDeleteLink = async (linkId: string) => {
    if (confirm('Are you sure you want to delete this link?')) {
      try {
        await serverDeleteLink({ data: { id: linkId } })
        queryClient.invalidateQueries({ queryKey: ['links', teamId] })
        toast.success('Link deleted successfully')
      } catch (error) {
        console.error('Failed to delete link:', error)
        toast.error('Failed to delete link')
      }
    }
  }

  const handleTogglePin = async (linkId: string, isPinned: boolean) => {
    try {
      toast.success(`Link ${isPinned ? 'pinned' : 'unpinned'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['links', teamId] })
    } catch (error) {
      console.error('Failed to toggle pin:', error)
      toast.error('Failed to update link')
    }
  }

  const handleLinkFormSuccess = (link: any) => {
    queryClient.invalidateQueries({ queryKey: ['links', teamId] })
    toast.success(`Link ${editingLink ? 'updated' : 'created'} successfully`)
    setEditingLink(null)
    setIsCreatingLink(false)
  }

  const handleSelectLink = (linkId: string, selected: boolean) => {
    setSelectedLinks(prev => {
      if (selected) {
        return [...prev, linkId]
      } else {
        return prev.filter(id => id !== linkId)
      }
    })
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedLinks(links.map(link => link.id))
    } else {
      setSelectedLinks([])
    }
  }

  const handleBulkAction = async (action: string, linkIds: string[]) => {
    try {
      switch (action) {
        case 'delete':
          await serverBulkDeleteLinks({ data: { linkIds } })
          break
        case 'unpin':
          await serverBulkUpdateLinks({
            data: {
              linkIds,
              updates: { isPinned: false }
            }
          })
          break
        case 'public':
          await serverBulkUpdateLinks({
            data: {
              linkIds,
              updates: { visibility: 'team' }
            }
          })
          break
        case 'private':
          await serverBulkUpdateLinks({
            data: {
              linkIds,
              updates: { visibility: 'private' }
            }
          })
          break
        case 'archive':
          await serverBulkUpdateLinks({
            data: {
              linkIds,
              updates: { status: 'archived' }
            }
          })
          break
        case 'export':
          const selectedLinkData = links.filter(link => linkIds.includes(link.id))
          const exportData = JSON.stringify(selectedLinkData, null, 2)
          const blob = new Blob([exportData], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'pinned-links-export.json'
          a.click()
          URL.revokeObjectURL(url)
          break
        default:
          console.log(`Unknown bulk action: ${action}`)
          throw new Error(`Unknown bulk action: ${action}`)
      }

      queryClient.invalidateQueries({ queryKey: ['links', teamId] })
      setSelectedLinks([])
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error)
      throw error
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const clearSearch = () => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setIsSearchActive(false)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      categoryId: 'all',
      applicationId: 'all',
      visibility: 'all',
      status: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters = useSearch || Object.values(filters).some(value => value !== 'all' && value !== 'createdAt' && value !== 'desc')

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 border-b bg-background"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Pin className="h-8 w-8 text-primary" />
              Pinned Links
            </h1>
            <p className="text-muted-foreground mt-1">Quick access to your important links</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pinned links..."
                className="pl-10 w-64 pr-8"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  // Only set search as active if there's actual content
                  if (e.target.value.trim()) {
                    setIsSearchActive(true)
                  } else {
                    setIsSearchActive(false)
                  }
                }}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                  onClick={clearSearch}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              {isFetching && isSearchActive && (
                <div className="absolute right-8 top-2.5">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </form>

            {/* Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">Active</Badge>
                  )}
                  {isFetching && !isLoading && hasActiveFilters && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-medium">Filters</h4>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                        Clear all
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Category Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        Category
                      </label>
                      <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          {categories.map((category) => (
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
                    </div>

                    {/* Application Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Application
                      </label>
                      <Select value={filters.applicationId} onValueChange={(value) => handleFilterChange('applicationId', value)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All applications" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All applications</SelectItem>
                          {applications.map((app) => (
                            <SelectItem key={app.id} value={app.id}>
                              {app.applicationName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Visibility Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          Visibility
                        </label>
                        <Select value={filters.visibility} onValueChange={(value) => handleFilterChange('visibility', value)}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="team">Team</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          Status
                        </label>
                        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Sort By */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sort By</label>
                        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="createdAt">Created</SelectItem>
                            <SelectItem value="updatedAt">Updated</SelectItem>
                            <SelectItem value="title">Title</SelectItem>
                            <SelectItem value="clickCount">Clicks</SelectItem>
                            <SelectItem value="lastAccessedAt">Last Accessed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort Order */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Order</label>
                        <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">Descending</SelectItem>
                            <SelectItem value="asc">Ascending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none border-x"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('compact')}
              >
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                </div>
              </Button>
            </div>

            {/* Add Link Button */}
            <Button onClick={() => setIsCreatingLink(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Links Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Bulk Operations */}
        <BulkOperations
          selectedLinks={selectedLinks}
          allLinks={links}
          onSelectLink={handleSelectLink}
          onSelectAll={handleSelectAll}
          onBulkAction={handleBulkAction}
          teamId={teamId}
        />

        {/* Loading indicator for refetching */}
        {isFetching && !isLoading && (
          <div className="flex items-center justify-center py-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              {useSearch ? 'Searching...' : 'Updating...'}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-4 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-20 w-full rounded-md" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-16" />
                    <div className="flex gap-1">
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-6 w-6 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <Pin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pinned links found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {useSearch
                  ? 'No pinned links match your search criteria. Try adjusting your search or filters.'
                  : 'Pin important links for quick access'
                }
              </p>
              {!useSearch && (
                <Button onClick={() => setIsCreatingLink(true)} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Link
                </Button>
              )}
              {useSearch && (
                <Button variant="outline" onClick={clearFilters} size="lg">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : viewMode === 'list'
                ? 'space-y-4'
                : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2'
            }
          >
            {links.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative"
              >
                {/* Selection Checkbox */}
                <LinkCheckbox
                  linkId={link.id}
                  isSelected={selectedLinks.includes(link.id)}
                  onSelect={handleSelectLink}
                />

                <LinkCard
                  viewMode={viewMode}
                  link={{
                    id: link.id,
                    title: link.title,
                    originalUrl: link.originalUrl,
                    shortUrl: link.shortUrl || undefined,
                    description: link.description || undefined,
                    visibility: link.visibility,
                    status: link.status,
                    isPinned: link.isPinned,
                    clickCount: link.clickCount,
                    lastAccessedAt: link.lastAccessedAt || undefined,
                    createdAt: link.createdAt,
                    categoryId: link.categoryId || undefined,
                    categoryName: categories.find(cat => cat.id === link.categoryId)?.name,
                    categoryColor: categories.find(cat => cat.id === link.categoryId)?.color || undefined,
                    applicationId: link.applicationId || undefined,
                    applicationName: applications.find(app => app.id === link.applicationId)?.applicationName,
                    applicationTla: applications.find(app => app.id === link.applicationId)?.tla,
                    tags: [], // TODO: Fetch tags for each link
                  }}
                  onEdit={handleEditLink}
                  onDelete={handleDeleteLink}
                  onTogglePin={handleTogglePin}
                  onCopyUrl={handleCopyUrl}
                  onRecordClick={handleRecordClick}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Link Form Dialog */}
      <LinkForm
        teamId={teamId}
        open={!!editingLink || isCreatingLink}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setEditingLink(null)
            setIsCreatingLink(false)
          }
        }}
        link={editingLink}
        onSuccess={handleLinkFormSuccess}
      />
    </div>
  )
}