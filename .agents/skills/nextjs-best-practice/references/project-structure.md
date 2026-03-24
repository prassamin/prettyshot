# Project Structure Conventions

## Table of Contents
- [Standard Layout](#standard-layout)
- [Folder Reference](#folder-reference)
- [Naming Conventions](#naming-conventions)
- [Export Convention](#export-convention)
- [File Conventions in App Router](#file-conventions-in-app-router)
- [Route Organization](#route-organization)
- [Component Organization](#component-organization)
- [Folder Examples](#folder-examples)

## Standard Layout

```
src/
├── app/                          # Routes, layouts, page.tsx + view.tsx ONLY
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── page.tsx          # Fetches session/redirect data
│   │   │   └── view.tsx          # Login form (Client Component)
│   │   ├── register/
│   │   │   ├── page.tsx
│   │   │   └── view.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── overview/
│   │   │   ├── page.tsx          # Fetches dashboard data
│   │   │   ├── view.tsx          # Interactive dashboard (Client Component)
│   │   │   └── loading.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   └── view.tsx
│   │   └── layout.tsx
│   ├── blog/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── view.tsx
│   │       └── loading.tsx
│   ├── api/                      # API routes (use sparingly)
│   │   └── webhook/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── actions/                      # Server Actions by domain
│   ├── auth.ts
│   ├── posts.ts
│   └── users.ts
├── components/                   # Reusable UI + route sub-components
│   ├── ui/                       # Primitives (Button, Input, Card, Dialog)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── card.tsx
│   ├── home/                     # Sub-components for app/home/view.tsx
│   │   ├── hero-section.tsx
│   │   └── featured-posts.tsx
│   ├── blog/                     # Sub-components for app/blog/**/view.tsx
│   │   ├── blog-header.tsx
│   │   ├── blog-content.tsx
│   │   ├── blog-comments.tsx
│   │   └── blog-like-button.tsx
│   ├── settings/                 # Sub-components for app/(dashboard)/settings/view.tsx
│   │   ├── profile-form.tsx
│   │   └── notification-settings.tsx
│   └── overview/                 # Sub-components for app/(dashboard)/overview/view.tsx
│       ├── stats-cards.tsx
│       └── activity-feed.tsx
├── config/                       # App and third-party configuration
│   ├── site.ts                   # Site metadata, name, URLs
│   ├── auth.ts                   # Auth provider config
│   ├── db.ts                     # Database client setup
│   └── env.ts                    # Typed env variable wrappers
├── constants/                    # App-wide constant values
│   ├── routes.ts                 # Route path constants
│   ├── api.ts                    # API endpoints, status codes
│   └── ui.ts                     # Breakpoints, limits, sizes
├── context/                      # React context providers
│   ├── auth-provider.tsx
│   └── theme-provider.tsx
├── hooks/                        # Custom React hooks
│   ├── use-debounce.ts
│   ├── use-media-query.ts
│   └── use-local-storage.ts
├── lib/                          # Utilities and reusable libraries
│   ├── utils.ts                  # Generic helpers (cn(), formatDate())
│   ├── fetcher.ts                # SWR/TanStack Query fetcher
│   └── api-client.ts             # Typed API request helpers
├── providers/                    # App-wide providers (wraps root layout)
│   ├── providers.tsx             # Single entry — composes all providers
│   ├── auth-provider.tsx         # Auth session provider
│   ├── theme-provider.tsx        # Theme / dark mode provider
│   └── query-provider.tsx        # TanStack Query / SWR provider
├── store/                        # Client state management
│   ├── use-sidebar-store.ts      # Zustand store example
│   └── use-cart-store.ts
├── styles/                       # Global styles
│   └── globals.css
├── types/                        # Shared TypeScript types
│   ├── index.ts                  # Core domain types (User, Post, etc.)
│   ├── api.ts                    # API response/request types
│   └── forms.ts                  # Form-specific types
└── validation/                   # Zod schemas
    ├── auth.ts                   # Login, register schemas
    ├── posts.ts                  # Post CRUD schemas
    └── common.ts                 # Shared validators (email, pagination)
```

## Folder Reference

| Folder | Purpose | What goes here | What does NOT go here |
|--------|---------|----------------|----------------------|
| `app/` | Application routes | `page.tsx`, `view.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` | Component definitions, business logic, utilities |
| `actions/` | Server Actions | `'use server'` functions grouped by domain | Client code, data fetching for reads |
| `components/` | Reusable UI | `ui/` primitives + `[feature]/` components | Page-level components, route files |
| `config/` | Configuration | Site config, env wrappers, third-party setup, feature flags | Runtime logic, components |
| `constants/` | Constant values | Routes, API endpoints, limits, enums, static mappings | Computed values, config that reads env |
| `context/` | React context | Providers and their types | Business logic, data fetching |
| `hooks/` | Custom hooks | `use*` functions for reusable client logic | Server-side code, components |
| `lib/` | Utilities | Helper functions, API clients, formatters, `cn()` | Config, constants, types |
| `providers/` | App-wide providers | Auth, theme, query client, composed `AppProvider` | Business logic, UI components |
| `store/` | Client state | Zustand/state stores for client-side state | Server state, data fetching logic |
| `styles/` | Styling | Global CSS, Tailwind config | Component-specific styles (use Tailwind classes) |
| `types/` | TypeScript types | Interfaces, type aliases, enums | Runtime code, validation schemas |
| `validation/` | Zod schemas | Form validation, Server Action input validation | Business logic, database queries |

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files/folders | kebab-case | `user-profile.tsx`, `use-debounce.ts` |
| Components | PascalCase export | `export function UserProfile()` |
| Hooks | camelCase with `use` prefix | `hooks/useDebounce.tsx`, `export function useDebounce()` |
| Server Actions | camelCase verb | `actions/posts.ts`, `export async function createPost()` |
| Types/Interfaces | PascalCase | `types/index.ts`, `export type User = { ... }` |
| Constants | UPPER_SNAKE_CASE | `export const MAX_RETRIES = 3` |
| Route folders | kebab-case | `app/user-settings/page.tsx` |
| Route groups | `(name)` | `app/(dashboard)/` |
| Dynamic routes | `[param]` | `app/posts/[id]/page.tsx` |
| Catch-all routes | `[...param]` | `app/docs/[...slug]/page.tsx` |

## Export Convention

**Named exports everywhere. `export default` ONLY where Next.js strictly requires it.**

| `export default` (Next.js required) | Named export (everything else) |
|--------------------------------------|-------------------------------|
| `page.tsx` | `view.tsx` |
| `layout.tsx` | `components/*` |
| `loading.tsx` | `hooks/*` |
| `error.tsx` | `lib/*` |
| `not-found.tsx` | `config/*` |
| `template.tsx` | `constants/*` |
| `default.tsx` | `context/*` |
| | `store/*` |
| | `validation/*` |
| | `actions/*` |
| | `types/*` |

```tsx
// view.tsx — NAMED export
'use client'
export function BlogView({ blog }: { blog: Blog }) { ... }

// page.tsx — DEFAULT export (Next.js requires it)
import { BlogView } from './view'
export default async function BlogPage() { ... }

// components — NAMED export
export function Button({ ...props }: ButtonProps) { ... }

// hooks — NAMED export
export function useDebounce<T>(value: T, delay: number): T { ... }

// config — NAMED export
export const siteConfig = { ... }
export const db = new PrismaClient()

// constants — NAMED export
export const ROUTES = { ... } as const

// store — NAMED export
export const useSidebarStore = create<SidebarStore>(...)

// validation — NAMED export
export const loginSchema = z.object({ ... })
```

## File Conventions in App Router

These are special files recognized by Next.js in the `app/` directory:

| File | Purpose |
|------|---------|
| `page.tsx` | Route UI — makes a route publicly accessible |
| `layout.tsx` | Shared UI for a segment and its children. Persists across navigation |
| `loading.tsx` | Loading UI — auto-wrapped in `<Suspense>` |
| `error.tsx` | Error UI — auto-wrapped in Error Boundary |
| `not-found.tsx` | 404 UI for `notFound()` calls |
| `route.ts` | API endpoint (GET, POST, etc.) |
| `template.tsx` | Like layout but re-renders on navigation (for animations) |
| `default.tsx` | Fallback for parallel routes |
| `opengraph-image.tsx` | OG image generation |
| `view.tsx` | Client Component that receives server-fetched data as props |

## Route Organization

### Route Groups for layout sharing

Group routes that share a layout without affecting the URL:

```
app/
├── (marketing)/           # URL: /about, /pricing
│   ├── about/page.tsx
│   ├── pricing/page.tsx
│   └── layout.tsx         # Marketing layout (header, footer)
├── (app)/                 # URL: /dashboard, /settings
│   ├── dashboard/page.tsx
│   ├── settings/page.tsx
│   └── layout.tsx         # App layout (sidebar, nav)
└── layout.tsx             # Root layout
```

### Parallel Routes for independent sections

Use `@slot` convention for independently loading sections:

```
app/
├── @analytics/
│   ├── page.tsx
│   └── loading.tsx
├── @team/
│   ├── page.tsx
│   └── loading.tsx
├── layout.tsx             # Renders both slots
└── page.tsx
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <>
      {children}
      <div className="grid grid-cols-2">
        {analytics}
        {team}
      </div>
    </>
  )
}
```

### Intercepting Routes for modals

```
app/
├── feed/
│   ├── page.tsx                    # Feed page
│   └── (..)photo/[id]/page.tsx     # Intercepts /photo/[id] — shows modal
├── photo/[id]/
│   └── page.tsx                    # Full photo page (direct URL access)
└── layout.tsx
```

## Component Organization

### `components/ui/` — Reusable primitives

Small, generic, no business logic. Styled with Tailwind. Used across all features.

```tsx
// components/ui/button.tsx
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        variant === 'ghost' && 'hover:bg-gray-100',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',
        className
      )}
      {...props}
    />
  )
}
```

### `components/[route]/` — Route sub-components (view.tsx decomposition)

Each route's `view.tsx` stays **thin** — a composition layer only. Break all meaningful UI into sub-components under `components/[route]/`.

**Mapping: `app/[route]/view.tsx` → `components/[route]/**`**

```
app/home/view.tsx                    → components/home/
app/blog/[id]/view.tsx               → components/blog/
app/(dashboard)/overview/view.tsx    → components/overview/
app/(dashboard)/settings/view.tsx    → components/settings/
```

#### Full example: Blog detail page

```
app/blog/[id]/
├── page.tsx              # Fetches blog + comments, passes to view
├── view.tsx              # Thin: composes blog sub-components
└── loading.tsx

components/blog/
├── blog-header.tsx       # Title, author, date
├── blog-content.tsx      # Rendered content
├── blog-comments.tsx     # Comment list + form
└── blog-like-button.tsx  # Like interaction
```

```tsx
// app/blog/[id]/page.tsx
import { db } from '@/config/db'
import { notFound } from 'next/navigation'
import { BlogDetailView } from './view'

export default async function BlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [blog, comments] = await Promise.all([
    db.blog.findUnique({ where: { id } }),
    db.comment.findMany({ where: { blogId: id } }),
  ])
  if (!blog) notFound()
  return <BlogDetailView blog={blog} comments={comments} />
}
```

```tsx
// app/blog/[id]/view.tsx — THIN composition only
'use client'

import type { Blog, Comment } from '@/types'
import { BlogHeader } from '@/components/blog/blog-header'
import { BlogContent } from '@/components/blog/blog-content'
import { BlogComments } from '@/components/blog/blog-comments'
import { BlogLikeButton } from '@/components/blog/blog-like-button'

interface BlogDetailViewProps {
  blog: Blog
  comments: Comment[]
}

export function BlogDetailView({ blog, comments }: BlogDetailViewProps) {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <BlogHeader title={blog.title} author={blog.author} date={blog.createdAt} />
      <BlogContent content={blog.content} />
      <BlogLikeButton blogId={blog.id} initialCount={blog.likes} />
      <BlogComments blogId={blog.id} comments={comments} />
    </article>
  )
}
```

```tsx
// components/blog/blog-header.tsx
import { formatDate } from '@/lib/utils'

interface BlogHeaderProps {
  title: string
  author: string
  date: string
}

export function BlogHeader({ title, author, date }: BlogHeaderProps) {
  return (
    <header>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-gray-500">{author} · {formatDate(date)}</p>
    </header>
  )
}
```

```tsx
// components/blog/blog-like-button.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface BlogLikeButtonProps {
  blogId: string
  initialCount: number
}

export function BlogLikeButton({ blogId, initialCount }: BlogLikeButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(false)

  return (
    <Button
      variant="ghost"
      onClick={() => {
        setLiked(!liked)
        setCount(c => liked ? c - 1 : c + 1)
      }}
    >
      {liked ? '❤️' : '🤍'} {count}
    </Button>
  )
}
```

#### Rules for view.tsx

1. **Keep it under ~50 lines** — If it grows larger, extract more sub-components
2. **No complex logic** — State management, effects, and handlers belong in sub-components
3. **Composition only** — Import sub-components, pass props, arrange layout
4. **Named export** — `export function XxxView()`, never `export default`
5. **Sub-components go in `components/[route]/`** — Not inline in view.tsx

### No Props Hell

**Only pass props that the child cannot obtain itself.** If a child can call a hook, read from context, or access a Zustand store — let the child do it directly.

```tsx
// BAD: Parent fetches shared state just to pass it down
export function BlogDetailView({ blog, comments }: BlogDetailViewProps) {
  const { user } = useAuth()
  const theme = useThemeStore()

  return (
    <>
      <BlogHeader title={blog.title} user={user} theme={theme} />
      <BlogComments blogId={blog.id} comments={comments} user={user} />
    </>
  )
}

// GOOD: Each child accesses shared state directly
export function BlogDetailView({ blog, comments }: BlogDetailViewProps) {
  return (
    <>
      <BlogHeader title={blog.title} />          {/* calls useAuth() internally */}
      <BlogComments blogId={blog.id} comments={comments} />  {/* calls useAuth() internally */}
    </>
  )
}
```

```tsx
// components/blog/blog-header.tsx — fetches its own shared state
'use client'

import { useAuth } from '@/providers/auth-provider'
import { formatDate } from '@/lib/utils'

interface BlogHeaderProps {
  title: string    // Only server data that child can't access on its own
}

export function BlogHeader({ title }: BlogHeaderProps) {
  const { user } = useAuth()   // Accesses auth directly — no prop needed

  return (
    <header>
      <h1 className="text-3xl font-bold">{title}</h1>
      {user && <p>Welcome back, {user.name}</p>}
    </header>
  )
}
```

**When to pass as props vs let child access:**

| Source | Pass as prop? | Why |
|--------|--------------|-----|
| Server data (from `page.tsx`) | Yes | Child has no way to access server-fetched data |
| Parent's local `useState` | Yes | Only parent owns this state |
| Context (`useAuth`, `useTheme`) | No | Child calls the hook directly |
| Zustand store (`useSidebarStore`) | No | Child calls the store hook directly |
| Custom hook (`useMediaQuery`) | No | Child calls the hook directly |
| SWR/TanStack Query (`useSWR`) | No | Child calls the hook directly (auto-deduped) |

## Folder Examples

### `config/` — Configuration

```tsx
// config/site.ts
export const siteConfig = {
  name: 'My App',
  description: 'A Next.js application',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const

// config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
})

export const env = envSchema.parse(process.env)

// config/db.ts
import 'server-only'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### `constants/` — Constant values

```tsx
// constants/routes.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  BLOG: '/blog',
  SETTINGS: '/settings',
} as const

// constants/api.ts
export const API_ENDPOINTS = {
  USERS: '/api/users',
  POSTS: '/api/posts',
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

// constants/ui.ts
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const
```

### `context/` — React context providers

```tsx
// context/auth-provider.tsx
'use client'

import { createContext, useContext } from 'react'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
}

const AuthContext = createContext<AuthContextValue>({ user: null })

export function AuthProvider({ user, children }: { user: User | null; children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### `providers/` — App-wide providers

Providers wrap the root layout to make shared state available throughout the app. Use a single `AppProvider` to compose all providers cleanly.

```tsx
// providers/auth-provider.tsx
'use client'

import { createContext, useContext } from 'react'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
}

const AuthContext = createContext<AuthContextValue>({ user: null })

export function AuthProvider({ user, children }: { user: User | null; children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

```tsx
// providers/query-provider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

```tsx
// providers/providers.tsx — Single entry point, composes ALL providers
'use client'

import type { User } from '@/types'
import { AuthProvider } from './auth-provider'
import { ThemeProvider } from './theme-provider'
import { QueryProvider } from './query-provider'

interface ProvidersProps {
  user: User | null
  children: React.ReactNode
}

export function Providers({ user, children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider user={user}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
```

```tsx
// app/layout.tsx — Clean. Only structure + Providers. Nothing else.
import { Providers } from '@/providers/providers'
import { getCurrentUser } from '@/config/auth'
import '@/styles/globals.css'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <html lang="en">
      <body>
        <Providers user={user}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

**Rules:**
- **Adding a new provider?** → Add it inside `providers.tsx`. Never touch `layout.tsx`.
- **layout.tsx stays minimal** — Only HTML structure, font, metadata, and `<Providers>`.
- Any child component anywhere in the tree can call `useAuth()`, `useTheme()`, etc. directly — no prop drilling.

### `store/` — Client state management

```tsx
// store/use-sidebar-store.ts
import { create } from 'zustand'

interface SidebarStore {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
}))
```

### `validation/` — Zod schemas

```tsx
// validation/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

// validation/posts.ts
import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(1, 'Required').max(200),
  content: z.string().min(1, 'Required'),
  published: z.boolean().default(false),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
```

### `lib/` — Utilities

```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}
```

### `actions/` — Server Actions by domain

```tsx
// actions/posts.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/config/db'
import { createPostSchema } from '@/validation/posts'
import { getCurrentUser } from '@/config/auth'

export async function createPost(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = createPostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await db.post.create({
    data: { ...parsed.data, authorId: user.id },
  })

  revalidatePath('/posts')
}
```
