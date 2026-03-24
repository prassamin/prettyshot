# Data Fetching Patterns

## Table of Contents
- [Server-Side Fetching](#server-side-fetching)
- [Caching Strategies](#caching-strategies)
- [Parallel Fetching](#parallel-fetching)
- [Request Deduplication](#request-deduplication)
- [Client-Side Fetching](#client-side-fetching)
- [Revalidation](#revalidation)

## Server-Side Fetching

Fetch data in Server Components. This is the default and preferred approach.

### Direct database access

```tsx
// app/users/page.tsx
import { db } from '@/config/db'

export default async function UsersPage() {
  const users = await db.user.findMany({ take: 20 })
  return <UserList users={users} />
}
```

### fetch() with caching

```tsx
export default async function Page() {
  // Static (cached until revalidated) — default behavior
  const staticData = await fetch('https://api.example.com/data')

  // Dynamic (never cached)
  const dynamicData = await fetch('https://api.example.com/data', {
    cache: 'no-store',
  })

  // Time-based revalidation
  const timedData = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 }, // revalidate every 60 seconds
  })

  // Tag-based revalidation
  const taggedData = await fetch('https://api.example.com/data', {
    next: { tags: ['posts'] },
  })
}
```

## Caching Strategies

| Strategy | When to Use | Config |
|----------|-------------|--------|
| Static | Data rarely changes (marketing pages, blog posts) | `cache: 'force-cache'` (default) |
| Revalidate | Data changes periodically (product catalog) | `next: { revalidate: N }` |
| Dynamic | Data changes per request (user dashboard) | `cache: 'no-store'` |
| On-demand | Revalidate after mutation | `revalidateTag()` / `revalidatePath()` |

### React.cache() for request deduplication

When multiple components need the same data in one request:

```tsx
// lib/data.ts
import { cache } from 'react'
import { db } from '@/config/db'

export const getUser = cache(async (userId: string) => {
  return db.user.findUnique({ where: { id: userId } })
})
```

```tsx
// Both components call getUser('123') — only one DB query executes
// app/profile/page.tsx
export default async function ProfilePage({ params }) {
  const user = await getUser(params.id)
  return <Profile user={user} />
}

// components/profile-header.tsx (Server Component)
export async function ProfileHeader({ userId }) {
  const user = await getUser(userId) // Deduplicated — same request
  return <h1>{user.name}</h1>
}
```

## Parallel Fetching

Never create waterfalls. Fetch independent data in parallel.

```tsx
// BAD: Sequential (waterfall)
export default async function Dashboard() {
  const user = await getUser()        // 200ms
  const posts = await getPosts()      // 300ms
  const analytics = await getAnalytics() // 150ms
  // Total: 650ms
}

// GOOD: Parallel
export default async function Dashboard() {
  const [user, posts, analytics] = await Promise.all([
    getUser(),        // 200ms
    getPosts(),       // 300ms
    getAnalytics(),   // 150ms
  ])
  // Total: 300ms (slowest request)
}
```

### Parallel with Suspense boundaries

For progressive loading, use separate Suspense boundaries:

```tsx
import { Suspense } from 'react'

export default function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <RecentPosts />
      </Suspense>
      <Suspense fallback={<AnalyticsSkeleton />}>
        <Analytics />
      </Suspense>
    </div>
  )
}

// Each component fetches its own data — they stream independently
async function UserProfile() {
  const user = await getUser()
  return <div>{user.name}</div>
}
```

## Request Deduplication

### Server-side: React.cache()

```tsx
import { cache } from 'react'

export const getCurrentUser = cache(async () => {
  const session = await getSession()
  return db.user.findUnique({ where: { id: session.userId } })
})
```

### Client-side: SWR

```tsx
'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function UserAvatar() {
  const { data: user } = useSWR('/api/user', fetcher)
  return <img src={user?.avatar} />
}

// Multiple components using the same key — SWR deduplicates automatically
export function UserName() {
  const { data: user } = useSWR('/api/user', fetcher)
  return <span>{user?.name}</span>
}
```

### Client-side: TanStack Query

```tsx
'use client'
import { useQuery } from '@tanstack/react-query'

export function UserProfile() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => fetch('/api/user').then(r => r.json()),
  })

  if (isLoading) return <Skeleton />
  return <div>{user.name}</div>
}
```

## Client-Side Fetching

Use only when you need:
- Real-time updates / polling
- Optimistic UI
- Data that depends on client-side state (e.g., infinite scroll position)

### SWR for polling

```tsx
'use client'
import useSWR from 'swr'

export function LiveNotifications() {
  const { data } = useSWR('/api/notifications', fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds
  })
  return <NotificationList items={data?.items ?? []} />
}
```

### TanStack Query for complex client state

```tsx
'use client'
import { useInfiniteQuery } from '@tanstack/react-query'

export function InfinitePostList() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 0 }) =>
      fetch(`/api/posts?cursor=${pageParam}`).then(r => r.json()),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  return (
    <>
      {data?.pages.flatMap(page => page.posts).map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </>
  )
}
```

## Revalidation

### Time-based

```tsx
// Revalidate this fetch every 60 seconds
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 },
})

// Or set at the page/layout level
export const revalidate = 60
```

### On-demand with tags

```tsx
// When fetching, tag the data
const posts = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] },
})

// In a Server Action, revalidate by tag
'use server'
import { revalidateTag } from 'next/cache'

export async function createPost(formData: FormData) {
  await db.post.create({ data: { /* ... */ } })
  revalidateTag('posts') // All fetches tagged 'posts' will refetch
}
```

### On-demand with path

```tsx
'use server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  await db.user.update({ /* ... */ })
  revalidatePath('/profile') // Revalidate the profile page
}
```
