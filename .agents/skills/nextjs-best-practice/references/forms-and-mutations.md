# Forms & Mutations

## Table of Contents
- [Server Actions Basics](#server-actions-basics)
- [Form Patterns](#form-patterns)
- [React Hook Form + Zod](#react-hook-form--zod)
- [Optimistic Updates](#optimistic-updates)
- [Error Handling](#error-handling)
- [Validation Strategy](#validation-strategy)

## Server Actions Basics

Server Actions are async functions that run on the server. Define with `'use server'`.

### Inline in Server Component

```tsx
// app/posts/page.tsx
export default function PostsPage() {
  async function createPost(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    await db.post.create({ data: { title } })
    revalidatePath('/posts')
  }

  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

### Separate file (preferred for reuse)

```tsx
// actions/posts.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/config/db'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  await db.post.create({ data: { title } })
  revalidatePath('/posts')
}

export async function deletePost(postId: string) {
  await db.post.delete({ where: { id: postId } })
  revalidatePath('/posts')
}
```

### Using in Client Components

```tsx
'use client'

import { createPost } from '@/actions/posts'

export function CreatePostForm() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

## Form Patterns

### Pattern 1: Simple form with useActionState

For forms that need pending state and server-returned errors.

```tsx
'use client'

import { useActionState } from 'react'
import { createPost } from '@/actions/posts'

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPost, {
    error: null,
  })

  return (
    <form action={formAction}>
      <input name="title" required />
      {state.error && <p className="text-red-500">{state.error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  )
}
```

The Server Action returns state:

```tsx
// actions/posts.ts
'use server'

type State = { error: string | null }

export async function createPost(prevState: State, formData: FormData): Promise<State> {
  const title = formData.get('title') as string

  if (!title) {
    return { error: 'Title is required' }
  }

  try {
    await db.post.create({ data: { title } })
    revalidatePath('/posts')
    return { error: null }
  } catch {
    return { error: 'Failed to create post' }
  }
}
```

### Pattern 2: Submit button with useFormStatus

```tsx
'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : children}
    </button>
  )
}
```

### Pattern 3: Non-form mutations (button click)

```tsx
'use client'

import { deletePost } from '@/actions/posts'
import { useTransition } from 'react'

export function DeleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => deletePost(postId))}
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
```

## React Hook Form + Zod

For complex forms with client-side validation (multi-field, conditional logic, real-time validation).

### Setup

```bash
npm install react-hook-form @hookform/resolvers zod
```

### Pattern: Client validation + Server Action

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPostSchema, type CreatePostInput } from '@/validation/posts'
import { createPost } from '@/actions/posts'
import { useTransition } from 'react'

export function CreatePostForm() {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
  })

  function onSubmit(data: CreatePostInput) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value))
    })

    startTransition(async () => {
      const result = await createPost(formData)
      if (!result?.error) reset()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          {...register('title')}
          placeholder="Post title"
          className="w-full rounded border px-3 py-2"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>
      <div>
        <textarea
          {...register('content')}
          placeholder="Write your post..."
          className="w-full rounded border px-3 py-2"
          rows={6}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        {isPending ? 'Publishing...' : 'Publish'}
      </button>
    </form>
  )
}
```

## Optimistic Updates

Use `useOptimistic` for instant UI feedback before server confirms.

```tsx
'use client'

import { useOptimistic } from 'react'
import { toggleLike } from '@/actions/posts'

export function LikeButton({ postId, liked, count }: {
  postId: string
  liked: boolean
  count: number
}) {
  const [optimistic, setOptimistic] = useOptimistic(
    { liked, count },
    (state, newLiked: boolean) => ({
      liked: newLiked,
      count: newLiked ? state.count + 1 : state.count - 1,
    })
  )

  async function handleToggle() {
    setOptimistic(!optimistic.liked)
    await toggleLike(postId)
  }

  return (
    <form action={handleToggle}>
      <button type="submit">
        {optimistic.liked ? '❤️' : '🤍'} {optimistic.count}
      </button>
    </form>
  )
}
```

## Error Handling

### Server Action error pattern

Always return structured errors from Server Actions. Never throw — return error state.

```tsx
// actions/posts.ts
'use server'

type ActionResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createPost(formData: FormData): Promise<ActionResult> {
  const parsed = createPostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    await db.post.create({ data: parsed.data })
    revalidatePath('/posts')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to create post. Please try again.' }
  }
}
```

## Validation Strategy

**Always validate on both client AND server.**

```
Client (UX)                          Server (Security)
┌─────────────────┐                  ┌─────────────────┐
│ React Hook Form │ ── submit ──►    │ Server Action    │
│ + Zod schema    │                  │ + same Zod schema│
│                 │                  │ + auth check     │
│ Instant feedback│                  │ + rate limiting  │
└─────────────────┘                  └─────────────────┘
```

Share the same Zod schema between client and server:

```tsx
// lib/validations.ts — shared schema
export const createPostSchema = z.object({
  title: z.string().min(1, 'Required').max(200),
  content: z.string().min(1, 'Required'),
})

// Client: zodResolver(createPostSchema)
// Server: createPostSchema.safeParse(data)
```

Server Actions MUST always:
1. Authenticate the user
2. Validate all input with Zod
3. Authorize the action (does user have permission?)
4. Return structured errors (never throw to client)
