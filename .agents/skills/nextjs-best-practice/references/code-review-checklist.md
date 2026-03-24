# Code Review Checklist

Use this checklist when reviewing Next.js 15 code. Items are ordered by impact.

## Architecture

- [ ] **page.tsx + view.tsx pattern** — Routes with interactivity use `page.tsx` (server fetch) + `view.tsx` (client render). No `useEffect` for initial data
- [ ] **view.tsx is thin (~50 lines max)** — Composition only, sub-components extracted to `components/[route]/`
- [ ] **No props hell** — Don't pass context/store/hook values as props. Let children call `useAuth()`, `useSidebarStore()`, etc. directly
- [ ] **Props only for server data** — Only pass what the child cannot access on its own (server-fetched data, parent-local state)
- [ ] **Server Components by default** — `'use client'` only where interactivity is needed
- [ ] **`'use client'` at leaf nodes** — Not at page/layout level. Push client boundary as low as possible
- [ ] **No data fetching in Client Components** unless real-time/polling is required
- [ ] **No `useEffect` for data that could be fetched on the server**
- [ ] **useEffect vs useLayoutEffect** — DOM measurement, scroll position, focus, flicker prevention → `useLayoutEffect`. Everything else (API calls, subscriptions, timers) → `useEffect`
- [ ] **API routes used sparingly** — Prefer Server Actions for mutations, direct DB access for reads

## Data Fetching

- [ ] **No waterfalls** — Independent fetches use `Promise.all()` or separate `<Suspense>` boundaries
- [ ] **Appropriate caching** — `force-cache` for static, `no-store` for dynamic, `revalidate` for timed
- [ ] **React.cache() for shared data** — When multiple components need the same data per request
- [ ] **Revalidation after mutations** — `revalidateTag()` or `revalidatePath()` in Server Actions
- [ ] **Minimal data passed to Client Components** — Only send the fields the client needs

## Server Actions & Forms

- [ ] **Server-side validation** — All Server Actions validate input with Zod (never trust client data)
- [ ] **Authentication check** — Server Actions verify the user is authenticated
- [ ] **Authorization check** — Server Actions verify the user has permission for the action
- [ ] **Structured error returns** — Server Actions return `{ error }` objects, not throw
- [ ] **Loading states** — Forms show pending state via `useFormStatus` or `useActionState`
- [ ] **Shared Zod schemas** — Same schema for client and server validation

## Security

- [ ] **No secrets in client code** — Environment variables without `NEXT_PUBLIC_` are server-only
- [ ] **`server-only` package** — Sensitive modules import `server-only` to prevent client import
- [ ] **Input sanitization** — User input is validated before database operations
- [ ] **CSRF protection** — Server Actions have built-in CSRF protection (no extra work needed)
- [ ] **No sensitive data in URLs** — Tokens, passwords, etc. never in query params

## Performance

- [ ] **Images use `next/image`** — Never raw `<img>` tags
- [ ] **Above-the-fold images have `priority`** — For LCP optimization
- [ ] **Links use `next/link`** — For automatic prefetching
- [ ] **Fonts use `next/font`** — For zero CLS font loading
- [ ] **Heavy components use `dynamic()`** — Charts, editors, maps loaded dynamically
- [ ] **No barrel file imports** — Import directly from component files
- [ ] **Third-party scripts use `next/script`** — With appropriate `strategy`
- [ ] **`loading.tsx` for async routes** — Every route with data fetching has a loading state

## Project Structure

- [ ] **`app/` contains only routes** — `page.tsx`, `view.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` only
- [ ] **Components in `components/`** — `ui/` for primitives, `[feature]/` for feature-specific
- [ ] **Server Actions in `actions/`** — Organized by domain, not colocated in routes
- [ ] **Config in `config/`** — DB client, auth setup, env wrappers, site metadata
- [ ] **Constants in `constants/`** — Route paths, API endpoints, static values
- [ ] **Context in `context/`** — React context providers
- [ ] **Hooks in `hooks/`** — Custom `use*` functions
- [ ] **Utilities in `lib/`** — `cn()`, formatters, API clients, generic helpers
- [ ] **Providers in `providers/`** — All providers composed in `providers.tsx`, root `layout.tsx` only imports `<Providers>`
- [ ] **layout.tsx is clean** — No provider nesting in layout. Only HTML structure, metadata, and `<Providers>`
- [ ] **State in `store/`** — Zustand/state management stores
- [ ] **Types in `types/`** — Shared TypeScript types, not scattered across files
- [ ] **Validation in `validation/`** — Zod schemas, shared between client and server

## Exports

- [ ] **Named exports everywhere** — `export function`, `export const` for all custom code
- [ ] **`export default` only for Next.js files** — `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`
- [ ] **No `export default` in** — `view.tsx`, components, hooks, lib, config, constants, context, providers, store, validation, actions, types

## TypeScript

- [ ] **No `any` types** — Use proper types or `unknown` with type guards
- [ ] **Props interfaces defined** — All component props are typed
- [ ] **Server Action return types** — Explicitly typed for client consumption
- [ ] **Zod infer for form types** — `z.infer<typeof schema>` instead of manual types

## Routing

- [ ] **Route groups for shared layouts** — `(marketing)`, `(dashboard)`, `(auth)`
- [ ] **Dynamic params properly typed** — `params: Promise<{ id: string }>` in Next.js 15
- [ ] **Metadata exported** — Pages export `metadata` or `generateMetadata` for SEO
- [ ] **`not-found.tsx` for 404s** — Custom 404 pages where appropriate
- [ ] **`error.tsx` for error boundaries** — Graceful error handling per route

## Tailwind CSS

- [ ] **`cn()` utility for conditional classes** — Using `clsx` + `tailwind-merge`
- [ ] **No inline styles** — Use Tailwind utilities or CSS modules
- [ ] **Responsive design** — Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- [ ] **Consistent spacing** — Use Tailwind's spacing scale, not arbitrary values
- [ ] **Dark mode support** — If applicable, use `dark:` variant consistently
