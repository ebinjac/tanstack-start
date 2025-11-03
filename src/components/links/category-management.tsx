import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Folder,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Palette,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import {
  serverGetCategories,
  serverCreateCategory,
  serverUpdateCategory,
  serverDeleteCategory
} from '@/lib/server/links'
import { toast } from 'sonner'

// Form validation schema
const CategoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  icon: z.string().max(50, 'Icon name too long').optional(),
})

type CategoryFormValues = z.infer<typeof CategoryFormSchema>

interface CategoryManagementProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryCreated?: (category: any) => void
  onCategoryUpdated?: (category: any) => void
  onCategoryDeleted?: (categoryId: string) => void
}

export function CategoryManagement({
  teamId,
  open,
  onOpenChange,
  onCategoryCreated,
  onCategoryUpdated,
  onCategoryDeleted
}: CategoryManagementProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [deletingCategory, setDeletingCategory] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#3b82f6',
      icon: 'Folder',
    },
  })

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open, teamId])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const result = await serverGetCategories({ data: { teamId } })
      if (result.success) {
        setCategories(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCategory = async (values: CategoryFormValues) => {
    setIsSubmitting(true)
    try {
      const categoryData = {
        ...values,
        teamId,
      }

      const result = await serverCreateCategory({ data: categoryData })
      
      if (result.success) {
        const newCategory = result.data
        setCategories(prev => [...prev, newCategory])
        setIsCreateDialogOpen(false)
        form.reset()
        toast.success('Category created successfully')
        onCategoryCreated?.(newCategory)
      } else {
        toast.error(`Failed to create category: ${result.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create category:', error)
      toast.error(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCategory = async (values: CategoryFormValues) => {
    if (!editingCategory) return

    setIsSubmitting(true)
    try {
      const result = await serverUpdateCategory({
        data: {
          id: editingCategory.id,
          ...values,
        }
      })
      
      if (result.success) {
        const updatedCategory = result.data
        setCategories(prev => 
          prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat)
        )
        setIsEditDialogOpen(false)
        setEditingCategory(null)
        form.reset()
        toast.success('Category updated successfully')
        onCategoryUpdated?.(updatedCategory)
      } else {
        toast.error(`Failed to update category: ${result.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to update category:', error)
      toast.error(`Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (moveLinksToCategoryId?: string) => {
    if (!deletingCategory) return

    setIsSubmitting(true)
    try {
      const result = await serverDeleteCategory({
        data: {
          id: deletingCategory.id,
          moveLinksToCategoryId,
        }
      })
      
      if (result.success) {
        setCategories(prev => prev.filter(cat => cat.id !== deletingCategory.id))
        setIsDeleteDialogOpen(false)
        setDeletingCategory(null)
        toast.success('Category deleted successfully')
        onCategoryDeleted?.(deletingCategory.id)
      } else {
        toast.error(`Failed to delete category: ${result.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.error(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (category: any) => {
    setEditingCategory(category)
    form.reset({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3b82f6',
      icon: category.icon || 'Folder',
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category: any) => {
    setDeletingCategory(category)
    setIsDeleteDialogOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[70vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Manage Categories
            </DialogTitle>
            <DialogDescription>
              Create, edit, and organize your link categories.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col h-[400px]">
            {/* Header with create button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Categories</h3>
              <Button 
                size="sm" 
                onClick={() => setIsCreateDialogOpen(true)}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </Button>
            </div>

            {/* Categories list */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8">
                  <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No categories yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first category to organize your links</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </div>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color || '#3b82f6' }}
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate">{category.name}</h4>
                        {category.description && (
                          <p className="text-xs text-muted-foreground truncate">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(category)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your links.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateCategory)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
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
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter category description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          {...field}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          {...field}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Category'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateCategory)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
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
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter category description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          {...field}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          {...field}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Category'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"?
            </DialogDescription>
          </DialogHeader>
          
          {deletingCategory && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This action cannot be undone. Links in this category will lose their category association.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">What would you like to do with links in this category?</Label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleDeleteCategory()}
                    disabled={isSubmitting}
                  >
                    Remove category from links
                  </Button>
                  {categories.length > 1 && (
                    <select
                      className="w-full p-2 border rounded-md"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleDeleteCategory(e.target.value)
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      <option value="">Move links to another category...</option>
                      {categories
                        .filter(cat => cat.id !== deletingCategory.id)
                        .map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteCategory()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Category'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}