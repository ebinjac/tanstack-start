import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  Upload,
  FileText,
  Link2,
  CheckCircle,
  AlertCircle,
  Download,
  FileJson,
  FileSpreadsheet,
  Code,
  File
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { serverImportLinks } from '@/lib/server/import-links'

export const Route = createFileRoute('/team/$teamId/links/import')({
  component: ImportLinksPage,
})

interface ImportedLink {
  title: string
  originalUrl: string
  description?: string
  categoryId?: string
  applicationId?: string
  visibility?: 'team' | 'private'
  status?: 'active' | 'inactive'
  tags?: string[]
}

interface ImportResult {
  total: number
  successful: number
  failed: number
  errors: Array<{
    link: ImportedLink
    error: string
  }>
}

function ImportLinksPage() {
  const { teams, currentTeam } = useAuthContext()
  const { teamId } = Route.useParams()
  const queryClient = useQueryClient()
  
  // Form states
  const [importMethod, setImportMethod] = useState<'file' | 'text'>('file')
  const [fileType, setFileType] = useState<'json' | 'csv' | 'html' | 'markdown'>('json')
  const [file, setFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState('')
  const [importedLinks, setImportedLinks] = useState<ImportedLink[]>([])
  const [isPreview, setIsPreview] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)
  
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
  
  // Parse links from JSON
  const parseJSON = (content: string): ImportedLink[] => {
    try {
      const data = JSON.parse(content)
      // Handle different JSON structures
      if (Array.isArray(data)) {
        return data.map(item => ({
          title: item.title || item.name || '',
          originalUrl: item.url || item.originalUrl || item.link || '',
          description: item.description || '',
          tags: item.tags || []
        }))
      } else if (data.links && Array.isArray(data.links)) {
        return data.links.map((item: any) => ({
          title: item.title || item.name || '',
          originalUrl: item.url || item.originalUrl || item.link || '',
          description: item.description || '',
          tags: item.tags || []
        }))
      }
      return []
    } catch (error) {
      console.error('Error parsing JSON:', error)
      return []
    }
  }
  
  // Parse links from CSV
  const parseCSV = (content: string): ImportedLink[] => {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []
    
    // Try to detect header row
    const firstLine = lines[0]
    const hasHeader = /[a-zA-Z]/.test(firstLine)
    const startIndex = hasHeader ? 1 : 0
    
    const links: ImportedLink[] = []
    
    for (let i = startIndex; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      if (values.length >= 2) {
        links.push({
          title: values[0],
          originalUrl: values[1],
          description: values[2] || '',
          tags: values[3] ? values[3].split(';').map(t => t.trim()) : []
        })
      }
    }
    
    return links
  }
  
  // Parse links from HTML
  const parseHTML = (content: string): ImportedLink[] => {
    const links: ImportedLink[] = []
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content
    
    const anchorTags = tempDiv.querySelectorAll('a')
    anchorTags.forEach(anchor => {
      const href = anchor.getAttribute('href')
      const text = anchor.textContent?.trim()
      
      if (href && text) {
        links.push({
          title: text,
          originalUrl: href,
          description: anchor.getAttribute('title') || '',
          tags: []
        })
      }
    })
    
    return links
  }
  
  // Parse links from Markdown
  const parseMarkdown = (content: string): ImportedLink[] => {
    const links: ImportedLink[] = []
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    
    let match
    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        title: match[1],
        originalUrl: match[2],
        description: '',
        tags: []
      })
    }
    
    return links
  }
  
  // Parse content based on file type
  const parseContent = useCallback((content: string, type: string): ImportedLink[] => {
    switch (type) {
      case 'json':
        return parseJSON(content)
      case 'csv':
        return parseCSV(content)
      case 'html':
        return parseHTML(content)
      case 'markdown':
        return parseMarkdown(content)
      default:
        return []
    }
  }, [])
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        const links = parseContent(content, fileType)
        setImportedLinks(links)
        setIsPreview(true)
      }
      reader.readAsText(selectedFile)
    }
  }
  
  // Handle text content change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    setTextContent(content)
    if (content) {
      const links = parseContent(content, fileType)
      setImportedLinks(links)
      setIsPreview(true)
    } else {
      setImportedLinks([])
      setIsPreview(false)
    }
  }
  
  // Handle file type change
  const handleFileTypeChange = (value: string) => {
    setFileType(value as 'json' | 'csv' | 'html' | 'markdown')
    setImportedLinks([])
    setIsPreview(false)
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        const links = parseContent(content, value)
        setImportedLinks(links)
        setIsPreview(true)
      }
      reader.readAsText(file)
    } else if (textContent) {
      const links = parseContent(textContent, value)
      setImportedLinks(links)
      setIsPreview(true)
    }
  }
  
  // Import links
  const handleImport = async () => {
    if (importedLinks.length === 0) return
    
    setIsImporting(true)
    
    try {
      // Call the server function to import links
      const response = await serverImportLinks({
        data: {
          teamId,
          links: importedLinks
        }
      })
      
      if (response.success) {
        setImportResult(response.data)
        setShowResultDialog(true)
        
        // Invalidate queries to refresh the links list
        queryClient.invalidateQueries({ queryKey: ['links', teamId] })
        
        toast.success(`Imported ${response.data.successful} links successfully`)
      } else {
        toast.error('Failed to import links')
      }
    } catch (error) {
      console.error('Import failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import links')
    } finally {
      setIsImporting(false)
    }
  }
  
  // Reset import
  const handleReset = () => {
    setFile(null)
    setTextContent('')
    setImportedLinks([])
    setIsPreview(false)
    setImportResult(null)
  }
  
  // Get file icon based on type
  const getFileIcon = () => {
    switch (fileType) {
      case 'json':
        return <FileJson className="h-5 w-5" />
      case 'csv':
        return <FileSpreadsheet className="h-5 w-5" />
      case 'html':
        return <Code className="h-5 w-5" />
      case 'markdown':
        return <FileText className="h-5 w-5" />
      default:
        return <File className="h-5 w-5" />
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Import Links</h1>
          <p className="text-muted-foreground">
            Import links from various sources like JSON, CSV, HTML, or Markdown files
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Links
            </CardTitle>
            <CardDescription>
              Choose a method to import your links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={importMethod} onValueChange={(value) => setImportMethod(value as 'file' | 'text')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">Upload File</TabsTrigger>
                <TabsTrigger value="text">Paste Text</TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-type">File Type</Label>
                  <Select value={fileType} onValueChange={handleFileTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileJson className="h-4 w-4" />
                          JSON
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV
                        </div>
                      </SelectItem>
                      <SelectItem value="html">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          HTML
                        </div>
                      </SelectItem>
                      <SelectItem value="markdown">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Markdown
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Upload File</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      {getFileIcon()}
                      <div className="text-sm text-muted-foreground">
                        {file ? file.name : 'Drag and drop your file here, or click to browse'}
                      </div>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".json,.csv,.html,.md,.txt"
                        onChange={handleFileChange}
                        className="max-w-xs cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-type">Content Type</Label>
                  <Select value={fileType} onValueChange={handleFileTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileJson className="h-4 w-4" />
                          JSON
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV
                        </div>
                      </SelectItem>
                      <SelectItem value="html">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          HTML
                        </div>
                      </SelectItem>
                      <SelectItem value="markdown">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Markdown
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="text-content">Paste Content</Label>
                  <Textarea
                    id="text-content"
                    placeholder={`Paste your ${fileType} content here...`}
                    value={textContent}
                    onChange={handleTextChange}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            {isPreview && importedLinks.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Preview</h3>
                  <Badge variant="secondary">
                    {importedLinks.length} links found
                  </Badge>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Title</th>
                          <th className="px-4 py-2 text-left">URL</th>
                          <th className="px-4 py-2 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importedLinks.slice(0, 10).map((link, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2 truncate max-w-[200px]">{link.title}</td>
                            <td className="px-4 py-2 truncate max-w-[300px]">{link.originalUrl}</td>
                            <td className="px-4 py-2 truncate max-w-[200px]">{link.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {importedLinks.length > 10 && (
                    <div className="px-4 py-2 bg-muted text-center text-sm text-muted-foreground">
                      And {importedLinks.length - 10} more links...
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="flex-1"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Import Links
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </div>
            )}
            
            {isPreview && importedLinks.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No links found in the provided content. Please check the format and try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        {/* Format Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Format Examples
            </CardTitle>
            <CardDescription>
              Examples of supported formats for importing links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="json">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="json">JSON</TabsTrigger>
                <TabsTrigger value="csv">CSV</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
              </TabsList>
              
              <TabsContent value="json" className="space-y-2">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`[
  {
    "title": "Google",
    "url": "https://google.com",
    "description": "Search engine",
    "tags": ["search", "tool"]
  },
  {
    "title": "GitHub",
    "url": "https://github.com",
    "description": "Code repository",
    "tags": ["development", "code"]
  }
]`}
                </pre>
              </TabsContent>
              
              <TabsContent value="csv" className="space-y-2">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`Title,URL,Description,Tags
Google,https://google.com,Search engine,search;tool
GitHub,https://github.com,Code repository,development;code`}
                </pre>
              </TabsContent>
              
              <TabsContent value="html" className="space-y-2">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`<a href="https://google.com" title="Search engine">Google</a>
<a href="https://github.com" title="Code repository">GitHub</a>`}
                </pre>
              </TabsContent>
              
              <TabsContent value="markdown" className="space-y-2">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
{`[Google](https://google.com)
[GitHub](https://github.com)`}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Import Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {importResult?.successful === importResult?.total ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Import Results
            </DialogTitle>
            <DialogDescription>
              Review the results of your import
            </DialogDescription>
          </DialogHeader>
          
          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{importResult.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                  <div className="text-xs text-muted-foreground">Successful</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>
              
              {importResult.failed > 0 && importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-xs bg-muted p-2 rounded">
                        <div className="font-medium truncate">{error.link.title}</div>
                        <div className="text-muted-foreground">{error.error}</div>
                      </div>
                    ))}
                    {importResult.errors.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center">
                        And {importResult.errors.length - 5} more errors...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}