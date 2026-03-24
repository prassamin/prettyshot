# Server vs Client Components

## Table of Contents
- [Core Mental Model](#core-mental-model)
- [When to Use Server Components](#when-to-use-server-components)
- [When to Use Client Components](#when-to-use-client-components)
- [Composition Patterns](#composition-patterns)
- [Common Mistakes](#common-mistakes)

## Core Mental Model

Server Components run on the server only. They can:
- Access databases, file systems, internal APIs directly
- Use `async/await` at the component level
- Keep secrets and sensitive logic server-side
- Reduce client bundle size (their code never ships to browser)

Client Components run on both server (SSR) and client. They can:
- Use hooks (`useState`, `useEffect`, `useRef`, etc.)
- Handle events (`onClick`, `onChange`, etc.)
- Access browser APIs (`window`, `localStorage`, etc.)

## When to Use Server Components

**Default.** Every component is a Server Component unless marked `'use client'`.

```tsx
// app/users/page.tsx — Server Component (default)
import { db } from '@/config/db'
import { UserList } from '@/components/user-list'

export default async function UsersPage() {
  const users = await db.user.findMany()
  return <UserList users={users} />
}
```

Use for:
- Pages and layouts
- Data fetching
- Components that only render markup (no interactivity)
- Components accessing server-only resources

## When to Use Client Components

Add `'use client'` only when the component needs interactivity.

```tsx
// components/like-button.tsx
'use client'

import { useState } from 'react'

export function LikeButton({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount)
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Likes: {count}
    </button>
  )
}
```

Use for:
- Interactive UI (buttons, forms, toggles, modals)
- Components using React hooks
- Components needing browser APIs
- Third-party components that use hooks internally

## Composition Patterns

### Pattern 0: page.tsx + view.tsx (Team Standard)

**This is the primary pattern for all routes with interactivity.** See [project-structure.md](project-structure.md#pageview-pattern) for full details.

```
app/blog/[id]/
├── page.tsx    # async Server Component — fetches data
└── view.tsx    # 'use client' — receives data as props, all interactivity here
```

This pattern eliminates the need for `useEffect` data fetching entirely. The server fetches data, the client renders it.

### Pattern 1: Server parent, Client leaf

Push `'use client'` to the smallest possible component.

```tsx
// app/post/[id]/page.tsx — Server Component
import { getPost } from '@/lib/posts'
import { LikeButton } from '@/components/like-button'
import { CommentSection } from '@/components/comment-section'

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      {/* Only the interactive parts are Client Components */}
      <LikeButton initialCount={post.likes} />
      <CommentSection postId={post.id} />
    </article>
  )
}
```

### Pattern 2: Server Component as children of Client Component

Pass Server Components as `children` to avoid pulling them into the client bundle.

```tsx
// components/sidebar.tsx
'use client'

import { useState } from 'react'

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <aside className={isOpen ? 'w-64' : 'w-0'}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && children}
    </aside>
  )
}
```

```tsx
// app/dashboard/layout.tsx — Server Component
import { Sidebar } from '@/components/sidebar'
import { NavLinks } from '@/components/nav-links' // Server Component

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar>
        <NavLinks /> {/* Stays on server despite being inside Client Component */}
      </Sidebar>
      <main>{children}</main>
    </div>
  )
}
```

### Pattern 3: Extracting interactive parts

Don't mark an entire component as client just because one part needs interactivity.

```tsx
// BAD: Entire card is a Client Component
'use client'
export function ProductCard({ product }) {
  const [inCart, setInCart] = useState(false)
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <span>{product.price}</span>
      <button onClick={() => setInCart(true)}>Add to Cart</button>
    </div>
  )
}

// GOOD: Only the button is a Client Component
// components/add-to-cart-button.tsx
'use client'
export function AddToCartButton({ productId }: { productId: string }) {
  const [inCart, setInCart] = useState(false)
  return <button onClick={() => setInCart(true)}>Add to Cart</button>
}

// components/product-card.tsx — Server Component
export function ProductCard({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <span>{product.price}</span>
      <AddToCartButton productId={product.id} />
    </div>
  )
}
```

## Common Mistakes

### Mistake 1: Marking pages as `'use client'`

Pages and layouts should almost never be Client Components. Fetch data at the page level, pass to client children.

### Mistake 2: Importing server-only code in Client Components

```tsx
// BAD: db import will fail in Client Component
'use client'
import { db } from '@/config/db' // Error!
```

Use the `server-only` package to guard server code:

```tsx
// lib/db.ts
import 'server-only'
import { PrismaClient } from '@prisma/client'
export const db = new PrismaClient()
```

### Mistake 3: Passing non-serializable props

Server → Client boundary only supports serializable data (no functions, Dates, Maps, etc.).

```tsx
// BAD: Passing a function from Server to Client
<ClientComponent onSubmit={async () => { /* ... */ }} /> // Won't work as plain function

// GOOD: Pass a Server Action instead
<ClientComponent onSubmit={submitAction} /> // Server Action is serializable
```

### Mistake 4: Unnecessary `'use client'` chains

Once a component is `'use client'`, all its imports become client too. Keep the boundary as low as possible to avoid pulling large dependency trees into the client bundle.
