# Performance Optimization

## Table of Contents
- [Critical: Eliminate Waterfalls](#critical-eliminate-waterfalls)
- [Critical: Bundle Size](#critical-bundle-size)
- [High: Server Performance](#high-server-performance)
- [Medium: Client Data Fetching](#medium-client-data-fetching)
- [Medium: Re-render Optimization](#medium-re-render-optimization)
- [Core Web Vitals](#core-web-vitals)

## Critical: Eliminate Waterfalls

### Parallel fetching with Promise.all

```tsx
// BAD: Sequential — 650ms total
const user = await getUser()
const posts = await getPosts()
const stats = await getStats()

// GOOD: Parallel — 300ms total (slowest request)
const [user, posts, stats] = await Promise.all([
  getUser(),
  getPosts(),
  getStats(),
])
```

### Defer await until needed

```tsx
// BAD: Blocks both branches
async function processOrder(order: Order) {
  const inventory = await checkInventory(order.itemId)
  if (order.type === 'digital') {
    return generateDownloadLink(order) // Didn't need inventory
  }
  return shipItem(order, inventory)
}

// GOOD: Await only in the branch that needs it
async function processOrder(order: Order) {
  if (order.type === 'digital') {
    return generateDownloadLink(order)
  }
  const inventory = await checkInventory(order.itemId)
  return shipItem(order, inventory)
}
```

### Suspense boundaries for streaming

```tsx
import { Suspense } from 'react'

export default function Dashboard() {
  return (
    <>
      {/* Fast content renders immediately */}
      <h1>Dashboard</h1>
      <Suspense fallback={<Skeleton />}>
        {/* Slow content streams in when ready */}
        <SlowDataComponent />
      </Suspense>
    </>
  )
}
```

### Use `loading.tsx` for route-level loading

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />
}
```

## Critical: Bundle Size

### Import directly — avoid barrel files

```tsx
// BAD: Barrel file pulls in everything
import { Button } from '@/components/ui'

// GOOD: Direct import — tree-shaking works
import { Button } from '@/components/ui/button'
```

### Dynamic imports for heavy components

```tsx
import dynamic from 'next/dynamic'

// Only loads when rendered
const Chart = dynamic(() => import('@/components/chart'), {
  loading: () => <ChartSkeleton />,
})

// For below-the-fold content
const Comments = dynamic(() => import('@/components/comments'), {
  ssr: false, // Skip SSR for client-only components
})
```

### Defer third-party scripts

```tsx
// BAD: Blocks hydration
import Analytics from 'heavy-analytics-lib'

// GOOD: Load after hydration
import dynamic from 'next/dynamic'
const Analytics = dynamic(() => import('heavy-analytics-lib'), { ssr: false })

// Or use next/script
import Script from 'next/script'
<Script src="https://analytics.example.com/script.js" strategy="lazyOnload" />
```

### Preload on user intent

```tsx
import dynamic from 'next/dynamic'
import { useState } from 'react'

const HeavyModal = dynamic(() => import('./heavy-modal'))

export function OpenModalButton() {
  const [show, setShow] = useState(false)
  return (
    <>
      <button
        onMouseEnter={() => {
          // Preload on hover — feels instant on click
          import('./heavy-modal')
        }}
        onClick={() => setShow(true)}
      >
        Open
      </button>
      {show && <HeavyModal />}
    </>
  )
}
```

## High: Server Performance

### React.cache() for request deduplication

```tsx
import { cache } from 'react'

// Called by multiple components — only executes once per request
export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } })
})
```

### Minimize data serialization at RSC boundaries

```tsx
// BAD: Sends entire user object to client
async function Page() {
  const user = await getUser() // 50 fields
  return <ClientProfile user={user} />
}

// GOOD: Send only what the client needs
async function Page() {
  const user = await getUser()
  return (
    <ClientProfile
      name={user.name}
      avatar={user.avatar}
      bio={user.bio}
    />
  )
}
```

### Use after() for non-blocking work

```tsx
import { after } from 'next/server'

export async function POST(request: Request) {
  const data = await request.json()
  const result = await db.post.create({ data })

  // Non-blocking: runs after response is sent
  after(async () => {
    await logAnalytics('post_created', result.id)
    await sendNotification(result.authorId)
  })

  return Response.json(result)
}
```

## Medium: Client Data Fetching

### SWR for automatic deduplication

```tsx
// Multiple components using same key → one request
const { data } = useSWR('/api/user', fetcher, {
  dedupingInterval: 2000,  // Dedupe within 2s window
  revalidateOnFocus: false, // Disable for non-critical data
})
```

### Passive event listeners

```tsx
// GOOD: Passive listener doesn't block scrolling
useEffect(() => {
  const handler = () => { /* scroll logic */ }
  window.addEventListener('scroll', handler, { passive: true })
  return () => window.removeEventListener('scroll', handler)
}, [])
```

## Medium: Re-render Optimization

### memo() for expensive child components

```tsx
import { memo } from 'react'

// Only re-renders when props actually change
const ExpensiveList = memo(function ExpensiveList({ items }: { items: Item[] }) {
  return items.map(item => <ComplexItem key={item.id} item={item} />)
})
```

### Functional setState for stable callbacks

```tsx
// BAD: New function reference every render
const increment = () => setCount(count + 1)

// GOOD: Stable callback — safe to pass as prop
const increment = () => setCount(c => c + 1)
```

### useTransition for non-urgent updates

```tsx
import { useTransition } from 'react'

export function SearchInput() {
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  return (
    <input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value)          // Urgent: update input
        startTransition(() => {
          filterResults(e.target.value)    // Non-urgent: can be interrupted
        })
      }}
    />
  )
}
```

## Core Web Vitals

### Images: Always use next/image

```tsx
import Image from 'next/image'

// Automatic optimization, lazy loading, proper sizing
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority          // Add for above-the-fold images (LCP)
  className="object-cover"
/>
```

### Fonts: Use next/font

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

### Metadata for SEO

```tsx
// app/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My App',
  description: 'Description for SEO',
  openGraph: {
    title: 'My App',
    description: 'Description for social sharing',
    images: ['/og-image.png'],
  },
}
```

### Links: Always use next/link

```tsx
import Link from 'next/link'

// Automatic prefetching on hover/viewport
<Link href="/about" className="text-blue-600 hover:underline">
  About
</Link>

// Disable prefetch for rarely-visited pages
<Link href="/terms" prefetch={false}>Terms</Link>
```
