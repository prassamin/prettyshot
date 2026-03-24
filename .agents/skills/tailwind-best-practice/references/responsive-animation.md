# Responsive Design & Animation

## Table of Contents
- [Responsive Conventions](#responsive-conventions)
- [Breakpoint Reference](#breakpoint-reference)
- [Common Responsive Patterns](#common-responsive-patterns)
- [Animation Setup](#animation-setup)
- [Built-in Animations](#built-in-animations)
- [Custom Animations](#custom-animations)
- [Transition Patterns](#transition-patterns)
- [Reduced Motion](#reduced-motion)

## Responsive Conventions

### Mobile-first always

Write base styles for mobile, add breakpoint prefixes to scale up:

```html
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
```

### Breakpoint order

Always ascending: base -> `sm:` -> `md:` -> `lg:` -> `xl:` -> `2xl:`

```html
<!-- GOOD -->
<h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">

<!-- BAD: Random order -->
<h1 class="lg:text-5xl text-2xl md:text-4xl sm:text-3xl">
```

## Breakpoint Reference

### Min-width variants (mobile-first)

| Prefix | Media query | Typical device |
|--------|-------------|----------------|
| (none) | — | Mobile (default) |
| `sm:` | `@media (width >= 640px)` | Large phone / small tablet |
| `md:` | `@media (width >= 768px)` | Tablet |
| `lg:` | `@media (width >= 1024px)` | Laptop |
| `xl:` | `@media (width >= 1280px)` | Desktop |
| `2xl:` | `@media (width >= 1536px)` | Large desktop |

### Max-width variants (below a breakpoint)

| Prefix | Media query |
|--------|-------------|
| `max-sm:` | `@media (width < 640px)` |
| `max-md:` | `@media (width < 768px)` |
| `max-lg:` | `@media (width < 1024px)` |
| `max-xl:` | `@media (width < 1280px)` |
| `max-2xl:` | `@media (width < 1536px)` |

### Negated variants (NOT at or above a breakpoint)

Tailwind v4 generates `not-*` variants using `@media not (width >= ...)`:

| Prefix | Media query |
|--------|-------------|
| `not-sm:` | `@media not (width >= 640px)` |
| `not-md:` | `@media not (width >= 768px)` |
| `not-lg:` | `@media not (width >= 1024px)` |
| `not-xl:` | `@media not (width >= 1280px)` |
| `not-2xl:` | `@media not (width >= 1536px)` |

```html
<!-- Red background only when NOT at lg or above -->
<div class="not-lg:bg-red-500">Mobile/tablet only</div>

<!-- Combine: style for everything EXCEPT md-to-lg range -->
<div class="not-md:hidden md:max-lg:flex">Visible only on md-lg</div>
```

### Breakpoint ranges

Stack min and max variants to target a specific range:

```html
<!-- Flex only between md and xl -->
<div class="md:max-xl:flex">...</div>

<!-- Single breakpoint: flex only on md (not lg and above) -->
<div class="md:max-lg:flex">...</div>
```

### Custom breakpoints

```css
@theme {
  --breakpoint-xs: 475px;
  --breakpoint-3xl: 1920px;
}
```

## Common Responsive Patterns

### Navigation

```html
<button class="lg:hidden">Menu</button>
<nav class="hidden lg:flex lg:items-center lg:gap-6">...</nav>
```

### Typography scaling

```html
<h1 class="text-2xl font-bold md:text-4xl lg:text-5xl">Heading</h1>
<p class="text-sm md:text-base lg:text-lg">Body</p>
```

### Padding scaling

```html
<section class="px-4 py-8 md:px-8 md:py-12 lg:px-12 lg:py-16">...</section>
```

### Show/hide

```html
<div class="block md:hidden">Mobile only</div>
<div class="hidden md:block">Desktop only</div>
```

### Sidebar layout

```html
<div class="flex flex-col lg:flex-row">
  <aside class="w-full border-b border-border lg:w-64 lg:border-b-0 lg:border-r">
    Sidebar
  </aside>
  <main class="flex-1 p-4 lg:p-8">Content</main>
</div>
```

## Animation Setup

Define custom animations in `globals.css`:

```css
@theme {
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-fade-out: fade-out 0.3s ease-out;
  --animate-slide-up: slide-up 0.3s ease-out;
  --animate-slide-down: slide-down 0.3s ease-out;
  --animate-slide-in-left: slide-in-left 0.3s ease-out;
  --animate-slide-in-right: slide-in-right 0.3s ease-out;
  --animate-scale-in: scale-in 0.2s ease-out;
  --animate-shimmer: shimmer 2s linear infinite;

  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(8px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

## Built-in Animations

```html
<div class="animate-spin">Spinner</div>
<div class="animate-ping">Notification dot</div>
<div class="animate-pulse">Loading skeleton</div>
<div class="animate-bounce">Scroll indicator</div>
```

## Custom Animations

```html
<main class="animate-fade-in">Page content</main>

<!-- Staggered -->
<li class="animate-slide-up" style="animation-delay: 0ms">Item 1</li>
<li class="animate-slide-up" style="animation-delay: 50ms">Item 2</li>
<li class="animate-slide-up" style="animation-delay: 100ms">Item 3</li>

<!-- Modal -->
<div class="animate-scale-in">Modal content</div>
```

## Transition Patterns

### Recommended durations

| Duration | Use case |
|----------|----------|
| `duration-150` | Micro-interactions (hover color, focus ring) |
| `duration-200` | Button state changes |
| `duration-300` | Content transitions (fade, slide) |
| `duration-500` | Page-level animations |

### Recommended easings

| Easing | Use case |
|--------|----------|
| `ease-out` | Entrances (appearing) |
| `ease-in` | Exits (disappearing) |
| `ease-in-out` | State changes (toggles) |

### Common transitions

```html
<button class="bg-primary transition-colors hover:bg-primary/90">
<div class="transition-transform hover:scale-105">
<div class="translate-y-2 opacity-0 transition-all data-[visible]:translate-y-0 data-[visible]:opacity-100">
```

## Reduced Motion

Always respect user preferences:

```html
<div class="motion-safe:animate-fade-in">Content</div>
<div class="animate-slide-up motion-reduce:animate-none motion-reduce:opacity-100">Content</div>
```

Global fallback in globals.css:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
