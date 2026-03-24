# Theming & Design Tokens

## Table of Contents
- [Color System Setup](#color-system-setup)
- [Semantic Token Reference](#semantic-token-reference)
- [Adding Custom Colors](#adding-custom-colors)
- [Dark Mode](#dark-mode)
- [Typography Tokens](#typography-tokens)
- [Spacing & Sizing Tokens](#spacing--sizing-tokens)
- [Common Mistakes](#common-mistakes)

## Color System Setup

### Step 1: Discuss with user

Before writing any styles, confirm with the user:
- What is the primary brand color?
- What accent/secondary colors are needed?
- Do they have an existing palette or want suggestions?
- Do they need a destructive/error color?
- **How many themes?** One (light only) or two (light + dark)?

### Step 2: Register in globals.css

Register tokens in `@theme` so Tailwind generates utility classes, then define values.

**Single theme** — Only `:root`, no `.dark`, no `@custom-variant`:

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-input: var(--input);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.15 0 0);
  --primary: oklch(0.55 0.2 250);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0.01 250);
  --secondary-foreground: oklch(0.2 0 0);
  --muted: oklch(0.95 0 0);
  --muted-foreground: oklch(0.55 0 0);
  --accent: oklch(0.95 0.01 250);
  --accent-foreground: oklch(0.2 0 0);
  --destructive: oklch(0.55 0.2 25);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.9 0 0);
  --ring: oklch(0.55 0.2 250);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.15 0 0);
  --input: oklch(0.9 0 0);
  --sidebar: oklch(0.97 0 0);
  --sidebar-foreground: oklch(0.15 0 0);
}
```

**Two themes (light + dark)** — `:root` for light, `.dark` for dark, plus `@custom-variant`:

```css
@import "tailwindcss";

@theme {
  /* ... same token registration as above ... */
}

/* Light mode */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.15 0 0);
  --primary: oklch(0.55 0.2 250);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0.01 250);
  --secondary-foreground: oklch(0.2 0 0);
  --muted: oklch(0.95 0 0);
  --muted-foreground: oklch(0.55 0 0);
  --accent: oklch(0.95 0.01 250);
  --accent-foreground: oklch(0.2 0 0);
  --destructive: oklch(0.55 0.2 25);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.9 0 0);
  --ring: oklch(0.55 0.2 250);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.15 0 0);
  --input: oklch(0.9 0 0);
  --sidebar: oklch(0.97 0 0);
  --sidebar-foreground: oklch(0.15 0 0);
}

/* Dark mode */
.dark {
  --background: oklch(0.12 0 0);
  --foreground: oklch(0.95 0 0);
  --primary: oklch(0.65 0.2 250);
  --primary-foreground: oklch(0.1 0 0);
  --secondary: oklch(0.2 0.01 250);
  --secondary-foreground: oklch(0.95 0 0);
  --muted: oklch(0.2 0 0);
  --muted-foreground: oklch(0.6 0 0);
  --accent: oklch(0.2 0.01 250);
  --accent-foreground: oklch(0.95 0 0);
  --destructive: oklch(0.6 0.2 25);
  --destructive-foreground: oklch(0.95 0 0);
  --border: oklch(0.25 0 0);
  --ring: oklch(0.65 0.2 250);
  --card: oklch(0.15 0 0);
  --card-foreground: oklch(0.95 0 0);
  --input: oklch(0.25 0 0);
  --sidebar: oklch(0.15 0 0);
  --sidebar-foreground: oklch(0.95 0 0);
}

/* Enable class-based dark mode */
@custom-variant dark (&:where(.dark, .dark *));
```

### Step 3: Use semantic classes

```html
<button class="bg-primary text-primary-foreground hover:bg-primary/90">
  Save
</button>
<div class="border border-border rounded-lg bg-card text-card-foreground">
  Card content
</div>
```

## Semantic Token Reference

### Core tokens (minimum required)

| Token | Purpose | Usage |
|-------|---------|-------|
| `background` | Page/app background | `bg-background` |
| `foreground` | Default text color | `text-foreground` |
| `primary` | Brand/action color | `bg-primary`, buttons, links |
| `primary-foreground` | Text on primary | `text-primary-foreground` |
| `secondary` | Secondary actions | `bg-secondary` |
| `secondary-foreground` | Text on secondary | `text-secondary-foreground` |
| `muted` | Subtle backgrounds | `bg-muted`, disabled states |
| `muted-foreground` | Subtle text | `text-muted-foreground`, placeholders |
| `accent` | Highlights, hover | `bg-accent` |
| `accent-foreground` | Text on accent | `text-accent-foreground` |
| `destructive` | Error/danger actions | `bg-destructive`, delete buttons |
| `border` | All borders | `border-border` |
| `ring` | Focus rings | `ring-ring` |
| `input` | Input borders | `border-input` |
| `card` | Card backgrounds | `bg-card` |
| `card-foreground` | Text on cards | `text-card-foreground` |

### Extended tokens (add as needed)

| Token | Purpose |
|-------|---------|
| `sidebar` / `sidebar-foreground` | Sidebar-specific colors |
| `popover` / `popover-foreground` | Dropdowns, tooltips |
| `success` / `warning` | Status indicators |
| `chart-1` through `chart-5` | Chart/visualization colors |

## Adding Custom Colors

When the project needs additional semantic colors:

```css
/* 1. Add CSS variable in both modes */
:root {
  --success: oklch(0.6 0.18 145);
  --success-foreground: oklch(1 0 0);
}
.dark {
  --success: oklch(0.55 0.15 145);
  --success-foreground: oklch(0.1 0 0);
}

/* 2. Register in @theme */
@theme {
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
}
```

Now `bg-success`, `text-success-foreground` etc. are available as utility classes.

## Dark Mode

### Class-based toggle setup

```css
/* Already included in globals.css setup */
@custom-variant dark (&:where(.dark, .dark *));
```

### Toggle implementation

```tsx
// Use next-themes or a custom hook
document.documentElement.classList.toggle('dark')
```

### When to use `dark:` prefix

Only for rare overrides where a specific element needs to differ from the token system:

```html
<!-- GOOD: Rare override for a specific visual effect -->
<div class="shadow-lg dark:shadow-none">

<!-- BAD: Using dark: for regular colors — tokens handle this -->
<div class="bg-white dark:bg-gray-900">
```

### Preventing flash on load

Add an inline script in `<head>` of your root layout that reads localStorage and sets the `.dark` class before the first paint. This prevents the white flash on dark-mode pages. Use `next/script` with `beforeInteractive` strategy or an inline script tag.

## Typography Tokens

```css
@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --font-heading: "Cal Sans", "Inter", sans-serif;
}
```

```html
<h1 class="font-heading text-4xl font-bold">Page Title</h1>
<p class="font-sans text-base">Body text</p>
<code class="font-mono text-sm">code snippet</code>
```

## Spacing & Sizing Tokens

Use Tailwind's default spacing scale. Only add custom tokens for app-specific layout values:

```css
@theme {
  --spacing-sidebar: 16rem;
  --spacing-header: 4rem;
  --spacing-page: 1200px;
}
```

```html
<aside class="w-sidebar">...</aside>
<header class="h-header">...</header>
<main class="max-w-page mx-auto">...</main>
```

## Common Mistakes

### Mistake 1: Hardcoded colors in components

```tsx
// BAD
<button className="bg-blue-600 hover:bg-blue-700 text-white">

// GOOD
<button className="bg-primary hover:bg-primary/90 text-primary-foreground">
```

### Mistake 2: Manual dark overrides everywhere

```tsx
// BAD
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">

// GOOD
<div className="bg-background text-foreground">
```

### Mistake 3: Arbitrary hex values

```tsx
// BAD
<div className="bg-[#1a73e8]">

// GOOD
<div className="bg-primary">
```

### Mistake 4: Not using oklch

Prefer `oklch()` for perceptually uniform colors:

```css
/* BAD */
--primary: #3b82f6;
--primary: hsl(217, 91%, 60%);

/* GOOD */
--primary: oklch(0.55 0.2 250);
```

### Mistake 5: Forgetting opacity modifier

```html
<!-- Use Tailwind's opacity modifier with semantic tokens -->
<div class="bg-primary/10">Subtle primary background</div>
<div class="border-border/50">Half-opacity border</div>
```

### Mistake 6: Arbitrary brackets for opacity

```html
<!-- BAD: Bracket syntax for opacity -->
<div class="bg-primary/[0.04]">
<div class="bg-muted/[0.08]">

<!-- GOOD: Native integer opacity (4 = 4%) -->
<div class="bg-primary/4">
<div class="bg-muted/8">
```

### Mistake 7: Arbitrary brackets for spacing/z-index

Tailwind v4 dynamically generates any spacing value (`value × 4px`) and any z-index:

```html
<!-- BAD -->
<div class="w-[400px] h-[200px] p-[32px] m-[16px] z-[999]">

<!-- GOOD -->
<div class="w-100 h-50 p-8 m-4 z-999">
```
