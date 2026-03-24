# Tailwind CSS Code Review Checklist

## Colors & Theming

- [ ] **No hardcoded colors** — No `bg-blue-500`, `text-[#fff]`, `border-gray-200`
- [ ] **Semantic tokens used** — `bg-primary`, `text-foreground`, `border-border`
- [ ] **oklch() format** — CSS variables use `oklch()`, not hex or hsl
- [ ] **Opacity modifier** — Use `bg-primary/10` not a separate opacity utility
- [ ] **@theme registered** — All custom colors registered via `--color-*` in `@theme`
- [ ] **Correct mode setup** — Single theme: `:root` only. Two themes: `:root` (light) + `.dark` (dark). Don't add `.dark` if user only needs one theme

## Gradients

- [ ] **v4 syntax** — `bg-linear-to-r`, never v3 `bg-gradient-to-r`
- [ ] **Angle gradients** — `bg-linear-45` not `bg-[linear-gradient(45deg,...)]`
- [ ] **Radial/conic native** — `bg-radial`, `bg-conic-180`, no arbitrary CSS
- [ ] **Semantic colors in stops** — `from-primary to-secondary`, not `from-blue-500`

## Dark Mode

- [ ] **Tokens handle it** — Components use `bg-background`, not `bg-white dark:bg-gray-900`
- [ ] **`dark:` used sparingly** — Only for rare overrides (e.g., `shadow-lg dark:shadow-none`)
- [ ] **No flash on load** — Inline script sets `.dark` class before first paint

## Component Styling

- [ ] **`cn()` for conditional classes** — Using `clsx` + `tailwind-merge`
- [ ] **`className` last in cn()** — Allows consumer override
- [ ] **No `@apply` in components** — Only for base element resets in globals.css
- [ ] **Focus styles present** — `focus-visible:ring-2 focus-visible:ring-ring` on interactive elements
- [ ] **Transitions on interactives** — `transition-colors` on buttons, links, inputs

## Responsive

- [ ] **Mobile-first** — Base styles for mobile, breakpoint prefixes to scale up
- [ ] **Ascending order** — `base → sm: → md: → lg: → xl: → 2xl:`
- [ ] **No random breakpoint order** — `text-2xl sm:text-3xl md:text-4xl` not shuffled

## Spacing & Layout

- [ ] **Tailwind spacing scale** — No arbitrary values like `p-[13px]`, use `p-3`
- [ ] **Consistent gaps** — Use `gap-*` with flexbox/grid, not margin hacks
- [ ] **Max-width containers** — `max-w-7xl mx-auto` for page content

## Animation

- [ ] **Custom animations in @theme** — `--animate-*` registered, `@keyframes` defined
- [ ] **Reduced motion respected** — `motion-safe:` or `motion-reduce:` used
- [ ] **Appropriate durations** — `duration-150` for micro, `duration-300` for content, `duration-500` for page
- [ ] **Appropriate easings** — `ease-out` for entrances, `ease-in` for exits

## No Arbitrary Brackets

- [ ] **No bracket spacing** — `w-100` not `w-[400px]`, `p-8` not `p-[32px]` (v4: `value × 4px`)
- [ ] **No bracket opacity** — `bg-primary/4` not `bg-primary/[0.04]` (v4: integer = percent)
- [ ] **No bracket z-index** — `z-999` not `z-[999]` (v4: any integer works)
- [ ] **Brackets only when truly needed** — e.g., `grid-cols-[1fr_2fr]`

## Performance

- [ ] **No inline styles** — Use Tailwind utilities, not `style={{}}`
- [ ] **No duplicate utilities** — `cn()` merges conflicts (e.g., `p-2` + `p-4` = `p-4`)
