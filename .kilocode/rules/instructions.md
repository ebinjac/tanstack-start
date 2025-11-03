# TanStack Start Project - Best Practices & Development Rules

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)
- **Simplicity First**: Choose straightforward solutions over complex ones whenever possible
- **Clarity Over Cleverness**: Write code that is immediately understandable
- **Minimal Dependencies**: Avoid adding dependencies unless absolutely necessary
- **Simple solutions are easier to understand, maintain, and debug**

### YAGNI (You Aren't Gonna Need It)
- **Implement Only What's Needed**: Build functionality only when it's required, not anticipated
- **Avoid Speculative Features**: Don't build "just in case" features
- **Deferred Implementation**: Postpone features until clear requirements exist
- **Remove Unused Code**: Regularly clean up unused imports, functions, and components

## Project Structure & File Organization

### Directory Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── forms/           # Form-related components
│   ├── layout/          # Layout components
│   └── features/        # Feature-specific components
├── lib/                 # Utility functions and configurations
│   ├── server/          # Server functions only
│   ├── utils/           # Shared utilities
│   ├── validations/     # Zod schemas
│   └── constants/       # Application constants
├── hooks/               # Custom React hooks
├── routes/              # File-based routing
├── styles/              # Global styles and themes
└── types/               # TypeScript type definitions
```

### File Naming Conventions
- **kebab-case for ALL files**: `user-profile.tsx`, `api-handler.ts`, `form-validation.ts`
- **Component files**: Use descriptive names with their purpose: `user-card.tsx`, `navigation-menu.tsx`
- **Server functions**: Prefix with `server-`: `server-get-users.ts`, `server-create-post.ts`
- **Utility files**: Group by functionality: `date-utils.ts`, `format-utils.ts`

### Component Organization Rules

#### 1. Small, Focused Components
```tsx
// ❌ AVOID - Large component handling multiple concerns
// user-profile.tsx (200+ lines)
function UserProfile() {
  // fetching logic
  // form handling
  // validation
  // UI rendering
  // error handling
  // ... 200 lines of code
}

// ✅ PREFERRED - Split into smaller components
// user-profile.tsx (main container)
function UserProfile() {
  return (
    <div>
      <UserProfileHeader />
      <UserProfileDetails />
      <UserProfileActions />
    </div>
  )
}

// user-profile-header.tsx (20 lines)
function UserProfileHeader() {
  return <header>{/* Header content */}</header>
}

// user-profile-details.tsx (30 lines)
function UserProfileDetails() {
  return <section>{/* Details content */}</section>
}

// user-profile-actions.tsx (25 lines)
function UserProfileActions() {
  return <div>{/* Action buttons */}</div>
}
```

#### 2. Single Responsibility Principle
- Each component should have one clear purpose
- If a component does more than one thing, split it
- Keep components under 100 lines whenever possible

#### 3. Component File Structure
```tsx
// component-name.tsx
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// Interface definitions first
interface ComponentNameProps {
  className?: string
  children: React.ReactNode
  // ... other props
}

// Animation variants (if needed)
const variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

// Main component
export function ComponentName({ className, children }: ComponentNameProps) {
  return (
    <motion.div
      className={cn('base-styles', className)}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}
```

## TanStack Start Best Practices

### 1. Server Functions Only
**All data operations must use server functions - no API routes**

```tsx
// ✅ CORRECT - Server function approach
// lib/server/users.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const GetUserSchema = z.object({
  id: z.string().uuid()
})

export const serverGetUser = createServerFn()
  .validator(GetUserSchema)
  .handler(async ({ data }) => {
    // Server-only code
    const user = await db.users.findUnique({
      where: { id: data.id }
    })
    return user
  })

// ❌ AVOID - Traditional API routes
// routes/api/users/[id].ts - DO NOT CREATE
```

### 2. Server Function Patterns

#### Data Fetching
```tsx
// lib/server/posts.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const serverGetPosts = createServerFn()
  .handler(async () => {
    const posts = await db.posts.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return posts
  })

export const serverGetPost = createServerFn()
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const post = await db.posts.findUnique({
      where: { id: data.id },
      include: { author: true }
    })
    return post
  })
```

#### Data Mutations
```tsx
// lib/server/posts.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  published: z.boolean().default(false)
})

export const serverCreatePost = createServerFn({ method: 'POST' })
  .validator(CreatePostSchema)
  .handler(async ({ data }) => {
    const post = await db.posts.create({
      data: {
        ...data,
        authorId: getCurrentUserId() // Server-side auth
      }
    })
    return post
  })
```

### 3. Route Integration

#### Suspense-Based Data Fetching (Preferred)
```tsx
// routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { serverGetPosts } from '@/lib/server/posts'
import { Suspense } from 'react'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/posts')({
  component: PostsPage,
})

function PostsPage() {
  return (
    <Suspense
      fallback={
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="loading-container"
        >
          <PostsSkeleton />
        </motion.div>
      }
    >
      <PostsContent />
    </Suspense>
  )
}

function PostsContent() {
  const { data: posts } = useSuspenseQuery({
    queryKey: ['posts'],
    queryFn: () => serverGetPosts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PostsList posts={posts} />
    </motion.div>
  )
}
```

#### Parallel Data Fetching with useSuspenseQueries
```tsx
// routes/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQueries } from '@tanstack/react-query'
import { serverGetPosts, serverGetUsers, serverGetStats } from '@/lib/server'
import { Suspense } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const [
    { data: posts },
    { data: users },
    { data: stats }
  ] = useSuspenseQueries({
    queries: [
      {
        queryKey: ['posts'],
        queryFn: () => serverGetPosts(),
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['users'],
        queryFn: () => serverGetUsers(),
        staleTime: 10 * 60 * 1000,
      },
      {
        queryKey: ['stats'],
        queryFn: () => serverGetStats(),
        staleTime: 2 * 60 * 1000,
      },
    ],
  })

  return (
    <div>
      <StatsOverview stats={stats} />
      <RecentPosts posts={posts.slice(0, 5)} />
      <ActiveUsers users={users.slice(0, 10)} />
    </div>
  )
}
```

#### Dynamic Routes with Suspense
```tsx
// routes/posts/$post-id.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { serverGetPost } from '@/lib/server/posts'
import { Suspense } from 'react'

export const Route = createFileRoute('/posts/$post-id')({
  component: PostPage,
})

function PostPage() {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostContent />
    </Suspense>
  )
}

function PostContent() {
  const { postId } = Route.useParams()
  const { data: post } = useSuspenseQuery({
    queryKey: ['post', postId],
    queryFn: () => serverGetPost({ id: postId }),
    staleTime: 10 * 60 * 1000,
  })

  return <PostDetail post={post} />
}
```

#### Prefetching for Better UX
```tsx
// components/posts/post-card.tsx
import { useQueryClient } from '@tanstack/react-query'
import { serverGetPost } from '@/lib/server/posts'

interface PostCardProps {
  post: {
    id: string
    title: string
    excerpt: string
  }
}

export function PostCard({ post }: PostCardProps) {
  const queryClient = useQueryClient()

  const handleMouseEnter = () => {
    // Prefetch post data when user hovers
    queryClient.prefetchQuery({
      queryKey: ['post', post.id],
      queryFn: () => serverGetPost({ id: post.id }),
      staleTime: 10 * 60 * 1000,
    })
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onMouseEnter={handleMouseEnter}
    >
      <Link to="/posts/$postId" params={{ postId: post.id }}>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
      </Link>
    </motion.div>
  )
}
```

## UI/UX with Framer Motion

### 1. Animation Principles
- **Subtle & Purposeful**: Animations should enhance, not distract
- **Consistent Timing**: Use consistent duration and easing
- **Performance**: Use `transform` and `opacity` for 60fps animations
- **Respect Preferences**: Honor `reduce-motion` preferences

### 2. Animation Patterns

#### Page Transitions
```tsx
// components/layout/page-transition.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from '@tanstack/react-router'

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.98,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

#### Component Animations
```tsx
// components/ui/animated-card.tsx
import { motion } from 'framer-motion'
import { Card, CardProps } from './card'

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, delay: 0.1 }
  },
  hover: { 
    y: -4,
    transition: { duration: 0.2 }
  }
}

interface AnimatedCardProps extends CardProps {
  delay?: number
}

export function AnimatedCard({ delay = 0, children, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={{ delay }}
    >
      <Card {...props}>{children}</Card>
    </motion.div>
  )
}
```

#### List Animations
```tsx
// components/ui/animated-list.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedListProps {
  items: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  className?: string
}

const listVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: 0.2 }
  }
}

export function AnimatedList({ items, renderItem, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={listVariants}
      initial="initial"
      animate="animate"
      className={cn('space-y-2', className)}
    >
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            layout
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
```

### 3. Responsive Animation
```tsx
// hooks/use-reduced-motion.ts
import { useMotionValueEvent, useScroll } from 'framer-motion'
import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setShouldReduceMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  return shouldReduceMotion
}

// Usage in components
function AnimatedComponent({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.div
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
      initial={shouldReduceMotion ? undefined : { opacity: 0 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1 }}
    >
      {children}
    </motion.div>
  )
}
```

## Code Quality Standards

### 1. TypeScript Rules
- **Strict Mode**: Always use strict TypeScript
- **No `any`**: Use proper types or `unknown`
- **Interface over Type**: Use `interface` for object shapes
- **Explicit Returns**: Always specify return types

```tsx
// ✅ CORRECT
interface User {
  id: string
  name: string
  email: string
}

async function getUser(id: string): Promise<User | null> {
  // Implementation
}

// ❌ AVOID
function getUser(id: any): any {
  // Implementation
}
```

### 2. Component Patterns
- **Props Interface**: Always define props interface
- **Default Props**: Use default parameters instead of defaultProps
- **Destructuring**: Destructure props at function signature

```tsx
// ✅ CORRECT
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick
}: ButtonProps) {
  return (
    <motion.button
      className={cn('button', variant, size)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  )
}
```

### 3. Error Handling
- **Boundaries**: Use error boundaries for component errors
- **Server Functions**: Handle errors in server functions
- **User Feedback**: Show user-friendly error messages

```tsx
// components/error-boundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>Please try refreshing the page</p>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Performance Guidelines

### 1. Suspense for Better UX
- **Always use Suspense**: Wrap data-fetching components in Suspense boundaries
- **Meaningful Fallbacks**: Provide skeleton loaders that match the final UI
- **Nested Suspense**: Use multiple Suspense boundaries for granular loading states

```tsx
// components/ui/suspense-boundary.tsx
import { Suspense } from 'react'
import { motion } from 'framer-motion'

interface SuspenseBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SuspenseBoundary({ children, fallback }: SuspenseBoundaryProps) {
  return (
    <Suspense
      fallback={
        fallback || (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="loading-fallback"
          >
            <div className="animate-pulse">Loading...</div>
          </motion.div>
        )
      }
    >
      {children}
    </Suspense>
  )
}
```

### 2. Code Splitting
- **Route-based**: Use lazy loading for routes
- **Component-based**: Lazy load heavy components
- **Server Functions**: Server functions are automatically code-split

```tsx
// routes/heavy-page.tsx
import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/heavy-page')({
  component: lazyRouteComponent(() => import('./heavy-page-component')),
})
```

### 3. Optimistic Updates with Suspense
```tsx
// hooks/use-optimistic-mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { serverUpdatePost } from '@/lib/server/posts'

export function useOptimisticUpdatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: serverUpdatePost,
    onMutate: async (newPost) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      
      const previousPosts = queryClient.getQueryData(['posts'])
      
      queryClient.setQueryData(['posts'], (old: any) =>
        old?.map((post: any) =>
          post.id === newPost.id ? newPost : post
        )
      )
      
      return { previousPosts }
    },
    onError: (err, newPost, context) => {
      queryClient.setQueryData(['posts'], context?.previousPosts)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
```

### 4. Prefetching Strategies
```tsx
// hooks/use-prefetch-on-hover.ts
import { useQueryClient } from '@tanstack/react-query'

export function usePrefetchOnHover<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  staleTime = 5 * 60 * 1000
) {
  const queryClient = useQueryClient()

  return {
    onMouseEnter: () => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime,
      })
    },
  }
}

// Usage
function PostLink({ post }: { post: Post }) {
  const { onMouseEnter } = usePrefetchOnHover(
    ['post', post.id],
    () => serverGetPost({ id: post.id })
  )

  return (
    <Link to="/posts/$postId" params={{ postId: post.id }} onMouseEnter={onMouseEnter}>
      {post.title}
    </Link>
  )
}
```

## Development Workflow

### 1. Component Creation Checklist
- [ ] File name uses kebab-case
- [ ] Component is small and focused (< 100 lines)
- [ ] Props interface defined
- [ ] Default exports used
- [ ] Framer Motion added if needed
- [ ] Error handling implemented
- [ ] Accessibility considered

### 2. Server Function Checklist
- [ ] File name prefixed with `server-`
- [ ] Input validation with Zod
- [ ] Error handling implemented
- [ ] Return type defined
- [ ] No client-side code

### 3. Route Checklist
- [ ] File follows routing conventions
- [ ] Loader uses server functions
- [ ] Error component defined
- [ ] Loading state considered
- [ ] SEO meta tags added

## Testing Guidelines

### 1. Component Testing
```tsx
// components/__tests__/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### 2. Server Function Testing
```tsx
// lib/server/__tests__/users.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { serverGetUser } from '../users'

describe('serverGetUser', () => {
  beforeEach(() => {
    // Setup test database
  })

  it('returns user when valid ID provided', async () => {
    const user = await serverGetUser({ data: { id: 'user-123' } })
    expect(user).toBeDefined()
    expect(user.id).toBe('user-123')
  })

  it('returns null for non-existent user', async () => {
    const user = await serverGetUser({ data: { id: 'non-existent' } })
    expect(user).toBeNull()
  })
})
```

## Security Best Practices

### 1. Server Function Security
```tsx
// lib/server/auth-middleware.ts
import { createMiddleware } from '@tanstack/react-start'
import { z } from 'zod'

export const authMiddleware = createMiddleware()
  .server(async ({ next }) => {
    const userId = getCurrentUserId() // Server-side auth
    if (!userId) {
      throw new Error('Unauthorized')
    }
    
    return next({
      context: { userId }
    })
  })

// Usage
export const serverGetProfile = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // context.userId is available and validated
    return db.users.findUnique({ where: { id: context.userId } })
  })
```

### 2. Input Validation
```tsx
// lib/validations/post.ts
import { z } from 'zod'

export const CreatePostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .transform(val => val.trim()),
  content: z.string()
    .min(10, 'Content too short')
    .max(10000, 'Content too long'),
  published: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(5).default([])
})
```

This comprehensive rulebook provides clear guidelines for building a clean, maintainable, and performant TanStack Start application with server functions, Framer Motion animations, and best practices for file organization and component structure.