"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ExternalLink,
  Copy,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Eye,
  MoreHorizontal,
  Clock,
  Users,
  Folder,
  Tag,
  Building2,
  BarChart3,
  Lock,
} from "lucide-react"

interface LinkCardProps {
  link: {
    id: string
    title: string
    originalUrl: string
    shortUrl?: string
    description?: string
    visibility: "public" | "private" | "team"
    status: "active" | "inactive" | "archived"
    isPinned: boolean
    clickCount: number
    lastAccessedAt?: Date
    createdAt: Date
    categoryId?: string
    categoryName?: string
    categoryColor?: string
    applicationId?: string
    applicationName?: string
    applicationTla?: string
    tags?: Array<{
      id: string
      name: string
      color?: string
    }>
  }
  viewMode?: 'grid' | 'list' | 'compact'
  className?: string
  onEdit?: (link: any) => void
  onDelete?: (linkId: string) => void
  onTogglePin?: (linkId: string, isPinned: boolean) => void
  onCopyUrl?: (url: string) => void
  onRecordClick?: (linkId: string) => void
}

export function LinkCard({ link, viewMode = 'grid', className, onEdit, onDelete, onTogglePin, onCopyUrl, onRecordClick }: LinkCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getVisibilityIcon = () => {
    switch (link.visibility) {
      case "public":
        return <Eye className="h-3.5 w-3.5" />
      case "private":
        return <Lock className="h-3.5 w-3.5" />
      default:
        return <Users className="h-3.5 w-3.5" />
    }
  }

  const getVisibilityBadge = () => {
    switch (link.visibility) {
      case "public":
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-blue-light text-blue-primary border-blue-primary/30 dark:bg-blue-light dark:text-blue-accent dark:border-blue-primary/40"
          >
            {getVisibilityIcon()}
            Public
          </Badge>
        )
      case "private":
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-blue-light text-blue-primary border-blue-primary/30 dark:bg-blue-light dark:text-blue-accent dark:border-blue-primary/40"
          >
            {getVisibilityIcon()}
            Private
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-blue-light text-blue-primary border-blue-primary/30 dark:bg-blue-light dark:text-blue-accent dark:border-blue-primary/40"
          >
            {getVisibilityIcon()}
            Team
          </Badge>
        )
    }
  }

  const getStatusBadge = () => {
    switch (link.status) {
      case "active":
        return <Badge className="bg-blue-primary hover:bg-blue-primary/90 text-primary-foreground">Active</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      default:
        return <Badge variant="destructive">Archived</Badge>
    }
  }

  const handleCopyUrl = () => {
    const urlToCopy = link.shortUrl || link.originalUrl
    navigator.clipboard.writeText(urlToCopy)
    onCopyUrl?.(urlToCopy)
  }

  const handleExternalLinkClick = () => {
    onRecordClick?.(link.id)
    window.open(link.originalUrl, "_blank", "noopener,noreferrer")
  }

  const formatLastAccessed = (date?: Date) => {
    if (!date) return "Never"
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d`
  }

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "")
    } catch {
      return url
    }
  }

  // Grid view (default)
  if (viewMode === 'grid') {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn("h-full relative transition-all duration-200", className)}
      >
        <Card
          className={cn(
            "h-full flex flex-col overflow-hidden border transition-all duration-200",
            isHovered ? "shadow-md border-blue-primary/20" : "shadow-sm border-border/50",
            link.isPinned && "ring-2 ring-blue-primary/30 border-blue-primary/20",
          )}
        >
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5">
                  {link.isPinned && (
                    <Pin className="h-3.5 w-3.5 text-blue-primary fill-blue-primary flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 text-balance">
                      {link.title}
                    </CardTitle>
                    {link.description && (
                      <CardDescription className="text-xs line-clamp-1 mt-1 text-muted-foreground">
                        {link.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {getVisibilityBadge()}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted/60 transition-colors">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onTogglePin?.(link.id, !link.isPinned)}>
                      {link.isPinned ? (
                        <>
                          <PinOff className="h-4 w-4 mr-2" />
                          Unpin
                        </>
                      ) : (
                        <>
                          <Pin className="h-4 w-4 mr-2" />
                          Pin
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(link)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete?.(link.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-2.5 px-3 pb-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Link</span>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-muted/60 transition-colors"
                    onClick={handleCopyUrl}
                    title="Copy URL"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-muted/60 transition-colors"
                    onClick={handleExternalLinkClick}
                    title="Open link"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="group relative">
                <div
                  className="text-xs font-mono bg-muted/40 p-2 rounded-md border border-border/60 truncate text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  title={link.originalUrl}
                >
                  {getDomain(link.originalUrl)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {/* Application and Category */}
              {(link.applicationName || link.categoryName) && (
                <div className="flex flex-wrap gap-1.5">
                  {link.applicationName && (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 bg-blue-light border-blue-primary/30 text-blue-primary dark:bg-blue-light dark:text-blue-accent dark:border-blue-primary/40 hover:opacity-80 transition-opacity"
                    >
                      <Building2 className="h-2.5 w-2.5 mr-1" />
                      {link.applicationTla || link.applicationName}
                    </Badge>
                  )}
                  {link.categoryName && (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: link.categoryColor ? `${link.categoryColor}15` : undefined,
                        borderColor: link.categoryColor ? `${link.categoryColor}40` : undefined,
                        color: link.categoryColor || undefined,
                      }}
                    >
                      <Folder className="h-2.5 w-2.5 mr-1" />
                      {link.categoryName}
                    </Badge>
                  )}
                </div>
              )}

              {/* Tags - Changed to show hash symbol with tag color, text in foreground */}
              {link.tags && link.tags.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {link.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-1.5 py-0.5 font-medium text-foreground flex items-center gap-0.5"
                      >
                        <span
                          style={{
                            color: tag.color || "currentColor",
                          }}
                        >
                          #
                        </span>
                        {tag.name}
                      </span>
                    ))}
                    {link.tags.length > 4 && (
                      <span className="text-xs px-1.5 py-0.5 font-medium text-muted-foreground">
                        +{link.tags.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <div>{getStatusBadge()}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <Clock className="h-3 w-3" />
                    {formatLastAccessed(link.lastAccessedAt)}
                  </span>
                  <span className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <BarChart3 className="h-3 w-3" />
                    {link.clickCount}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // List view
  if (viewMode === 'list') {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn("relative transition-all duration-200", className)}
      >
        <Card
          className={cn(
            "overflow-hidden border transition-all duration-200",
            isHovered ? "shadow-md border-blue-primary/20" : "shadow-sm border-border/50",
            link.isPinned && "ring-2 ring-blue-primary/30 border-blue-primary/20",
          )}
        >
          <div className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {link.isPinned && (
                  <Pin className="h-3.5 w-3.5 text-blue-primary fill-blue-primary flex-shrink-0" />
                )}
                <h3 className="text-sm font-semibold truncate">{link.title}</h3>
                {link.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-md">{link.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{getDomain(link.originalUrl)}</span>
              {getVisibilityBadge()}
              {getStatusBadge()}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatLastAccessed(link.lastAccessedAt)}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <BarChart3 className="h-3 w-3" />
                {link.clickCount}
              </div>
              
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted/60 transition-colors"
                  onClick={handleCopyUrl}
                  title="Copy URL"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted/60 transition-colors"
                  onClick={handleExternalLinkClick}
                  title="Open link"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted/60 transition-colors">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onTogglePin?.(link.id, !link.isPinned)}>
                      {link.isPinned ? (
                        <>
                          <PinOff className="h-4 w-4 mr-2" />
                          Unpin
                        </>
                      ) : (
                        <>
                          <Pin className="h-4 w-4 mr-2" />
                          Pin
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(link)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete?.(link.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Compact view
  if (viewMode === 'compact') {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn("relative transition-all duration-200", className)}
      >
        <Card
          className={cn(
            "overflow-hidden border transition-all duration-200",
            isHovered ? "shadow-md border-blue-primary/20" : "shadow-sm border-border/50",
            link.isPinned && "ring-2 ring-blue-primary/30 border-blue-primary/20",
          )}
        >
          <div className="p-2 flex items-center gap-2">
            {link.isPinned && (
              <Pin className="h-3 w-3 text-blue-primary fill-blue-primary flex-shrink-0" />
            )}
            <h3 className="text-xs font-medium truncate flex-1">{link.title}</h3>
            
            <div className="flex items-center gap-1">
              {getVisibilityBadge()}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-muted/60 transition-colors"
                onClick={handleCopyUrl}
                title="Copy URL"
              >
                <Copy className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-muted/60 transition-colors"
                onClick={handleExternalLinkClick}
                title="Open link"
              >
                <ExternalLink className="h-2.5 w-2.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-muted/60 transition-colors">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onTogglePin?.(link.id, !link.isPinned)}>
                    {link.isPinned ? (
                      <>
                        <PinOff className="h-3.5 w-3.5 mr-2" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="h-3.5 w-3.5 mr-2" />
                        Pin
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(link)}>
                    <Edit className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete?.(link.id)} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Default to grid view
  return null
}
