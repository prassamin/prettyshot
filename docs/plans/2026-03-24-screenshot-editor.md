# Screenshot Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fun, full-featured screenshot beautification editor with upload, live preview, customization controls, and export.

**Architecture:** Client-side editor at `/editor`. Zustand store holds all editor state (image, background, padding, radius, shadow, frame, watermark, export settings). Preview renders as real DOM elements captured via html-to-image for export. Page/View pattern: server `page.tsx` → client `view.tsx`.

**Tech Stack:** Next.js 16, React 19, Zustand, HeroUI, Framer Motion, Tailwind v4, html-to-image, Lucide icons

---

## File Structure

```
src/
├── app/editor/
│   ├── page.tsx              # Server component (minimal shell)
│   └── view.tsx              # Client component (editor layout)
├── stores/
│   └── editor-store.ts       # Zustand store (all editor state + actions)
├── components/editor/
│   ├── editor-topbar.tsx     # Back button, title, export trigger
│   ├── upload-zone.tsx       # Drag & drop / paste / file picker
│   ├── preview-canvas.tsx    # Live preview rendering
│   ├── controls-sidebar.tsx  # Sidebar shell with tabbed/accordion sections
│   ├── controls/
│   │   ├── background-control.tsx   # Gradient presets, solid picker, image upload
│   │   ├── padding-control.tsx      # Padding slider + aspect ratio presets
│   │   ├── radius-control.tsx       # Border radius slider
│   │   ├── shadow-control.tsx       # Shadow preset cards
│   │   ├── frame-control.tsx        # Device frame selector cards
│   │   ├── watermark-control.tsx    # Text, position grid, opacity
│   │   └── export-control.tsx       # Format, scale, download, copy to clipboard
│   └── frames/
│       ├── browser-frame.tsx  # Browser window chrome
│       └── phone-frame.tsx    # Phone device frame
├── lib/
│   ├── presets.ts             # Gradient, shadow, frame preset data
│   └── export.ts              # html-to-image export utilities
```

---

## Task 1: Install dependency & create editor store

**Files:**
- Modify: `package.json` (add html-to-image)
- Create: `src/stores/editor-store.ts`
- Create: `src/lib/presets.ts`

- [ ] **Step 1: Install html-to-image**

```bash
bun add html-to-image
```

- [ ] **Step 2: Create preset data**

Create `src/lib/presets.ts` with:
- `GRADIENT_PRESETS`: array of `{ name, from, via?, to, className }` — ~12 gradient presets
- `SHADOW_PRESETS`: array of `{ name, className, value }` — none, soft, medium, hard, glow
- `ASPECT_RATIOS`: array of `{ name, value: number | null }` — auto, 16:9, 4:3, 1:1, 9:16

- [ ] **Step 3: Create Zustand editor store**

Create `src/stores/editor-store.ts` with state:
```ts
interface EditorState {
  // Image
  image: string | null        // data URL
  imageName: string
  // Background
  bgType: 'gradient' | 'solid' | 'image'
  bgGradient: string          // gradient className
  bgSolid: string             // hex color
  bgImage: string | null      // data URL
  // Styling
  padding: number             // 16-128
  borderRadius: number        // 0-48
  shadowPreset: string        // preset name
  // Frame
  frame: 'none' | 'browser' | 'phone'
  // Watermark
  watermarkText: string
  watermarkPosition: string   // 'bottom-right' etc
  watermarkOpacity: number    // 0-100
  // Export
  exportFormat: 'png' | 'jpg'
  exportScale: 1 | 2 | 3
  // Actions
  setImage(dataUrl: string, name: string): void
  clearImage(): void
  setBgType(type: EditorState['bgType']): void
  setBgGradient(className: string): void
  setBgSolid(hex: string): void
  setBgImage(dataUrl: string): void
  setPadding(n: number): void
  setBorderRadius(n: number): void
  setShadowPreset(name: string): void
  setFrame(frame: EditorState['frame']): void
  setWatermarkText(text: string): void
  setWatermarkPosition(pos: string): void
  setWatermarkOpacity(n: number): void
  setExportFormat(fmt: EditorState['exportFormat']): void
  setExportScale(scale: EditorState['exportScale']): void
  reset(): void
}
```

Default values: padding 48, borderRadius 16, shadow 'medium', bgType 'gradient', first gradient preset, frame 'none', exportFormat 'png', exportScale 2.

- [ ] **Step 4: Commit**

---

## Task 2: Editor page shell & layout

**Files:**
- Create: `src/app/editor/page.tsx`
- Create: `src/app/editor/view.tsx`
- Create: `src/components/editor/editor-topbar.tsx`

- [ ] **Step 1: Create server page**

`src/app/editor/page.tsx` — exports metadata + default component that renders `<EditorView />`.

- [ ] **Step 2: Create editor view (client layout)**

`src/app/editor/view.tsx` — `'use client'`. Full-screen layout:
- Top: `<EditorTopbar />`
- Left (~65%): Preview area (placeholder div for now)
- Right (~35%): Controls sidebar (placeholder div for now)
- Fun background: light warm tone matching the brand
- Mobile: stacked layout (preview top, controls bottom sheet)

- [ ] **Step 3: Create topbar**

`src/components/editor/editor-topbar.tsx` — `'use client'`.
- Back button (← PrettyShot logo link to /)
- Center: image filename or "Untitled"
- Right: Export button (HeroUI Button, gradient style)
- Clean, minimal, matches the playful brand

- [ ] **Step 4: Commit**

---

## Task 3: Upload zone

**Files:**
- Create: `src/components/editor/upload-zone.tsx`
- Modify: `src/app/editor/view.tsx` (wire in)

- [ ] **Step 1: Build upload zone component**

`src/components/editor/upload-zone.tsx` — `'use client'`. Shown when no image is loaded.
- Drag & drop area (full preview region)
- File picker button (HeroUI Button)
- Clipboard paste listener (`Ctrl+V` / `Cmd+V`)
- Accepts: image/png, image/jpeg, image/webp
- On drop/pick/paste: read file as data URL → call `setImage()`
- Fun UI: animated dashed border, bouncy icon, playful copy ("Drop your screenshot here!", "or paste from clipboard ⌘V")
- Drag-over state: border color change, scale animation
- Framer Motion entrance animation

- [ ] **Step 2: Wire into editor view**

In `view.tsx`: if `!image` show `<UploadZone />`, else show preview canvas.

- [ ] **Step 3: Commit**

---

## Task 4: Preview canvas

**Files:**
- Create: `src/components/editor/preview-canvas.tsx`
- Create: `src/components/editor/frames/browser-frame.tsx`
- Create: `src/components/editor/frames/phone-frame.tsx`
- Modify: `src/app/editor/view.tsx` (wire in)

- [ ] **Step 1: Build browser frame component**

SVG/HTML browser chrome: traffic light dots, URL bar, wraps children.

- [ ] **Step 2: Build phone frame component**

SVG/HTML phone bezel: notch, rounded corners, wraps children.

- [ ] **Step 3: Build preview canvas**

`src/components/editor/preview-canvas.tsx` — `'use client'`.
- Outer wrapper: checkered/dotted background (visual indicator, not exported)
- Inner `#capture-area` div (this gets exported):
  - Background layer (gradient/solid/image based on store)
  - Padding from store
  - The screenshot `<img>` with borderRadius from store
  - Shadow applied from store preset
  - Frame wrapper (if frame !== 'none')
  - Watermark overlay (if watermarkText is set)
- Reads all state from Zustand store
- Responsive: scales down to fit viewport via CSS transform
- Ref forwarded for export capture

- [ ] **Step 4: Wire into editor view**

Replace preview placeholder. Show `<UploadZone />` overlay when no image, `<PreviewCanvas />` when image loaded.

- [ ] **Step 5: Commit**

---

## Task 5: Controls sidebar shell

**Files:**
- Create: `src/components/editor/controls-sidebar.tsx`
- Modify: `src/app/editor/view.tsx` (wire in)

- [ ] **Step 1: Build sidebar shell**

`src/components/editor/controls-sidebar.tsx` — `'use client'`.
- Scrollable sidebar with accordion sections
- Each section: icon (gradient colored) + label + collapsible content
- Fun, spacious layout — big touch targets, generous padding
- Section order: Background, Padding & Size, Corners, Shadow, Frame, Watermark, Export
- Uses Framer Motion for expand/collapse
- Placeholder content per section (filled in subsequent tasks)

- [ ] **Step 2: Wire into editor view**

Replace sidebar placeholder. Show sidebar only when image is loaded.

- [ ] **Step 3: Commit**

---

## Task 6: Background control

**Files:**
- Create: `src/components/editor/controls/background-control.tsx`
- Modify: `src/components/editor/controls-sidebar.tsx` (wire in)

- [ ] **Step 1: Build background control**

Three sub-tabs: Gradient | Solid | Image
- **Gradient**: grid of visual gradient swatches from presets. Click to select. Active state with ring.
- **Solid**: color input (native or HeroUI) with some preset color dots.
- **Image**: file picker button + preview thumbnail. Drop support.
- All wired to Zustand store actions.

- [ ] **Step 2: Wire into sidebar**

- [ ] **Step 3: Commit**

---

## Task 7: Padding, radius, shadow, frame controls

**Files:**
- Create: `src/components/editor/controls/padding-control.tsx`
- Create: `src/components/editor/controls/radius-control.tsx`
- Create: `src/components/editor/controls/shadow-control.tsx`
- Create: `src/components/editor/controls/frame-control.tsx`
- Modify: `src/components/editor/controls-sidebar.tsx` (wire all in)

- [ ] **Step 1: Padding control**

- Slider (range input styled with Tailwind) for padding (16-128)
- Aspect ratio preset buttons (Auto, 16:9, 4:3, 1:1, 9:16) as pill toggles
- Live value display

- [ ] **Step 2: Radius control**

- Slider for border radius (0-48)
- Visual preview of current radius on a small square
- Quick presets: 0, 8, 16, 24, max

- [ ] **Step 3: Shadow control**

- Visual preset cards (none, soft, medium, hard, color glow)
- Each card shows a small square with the shadow applied
- Click to select, active ring

- [ ] **Step 4: Frame control**

- Visual cards: None (just image), Browser, Phone
- Each card shows a mini preview of the frame style
- Click to select

- [ ] **Step 5: Wire all into sidebar, commit**

---

## Task 8: Watermark control

**Files:**
- Create: `src/components/editor/controls/watermark-control.tsx`
- Modify: `src/components/editor/controls-sidebar.tsx` (wire in)

- [ ] **Step 1: Build watermark control**

- Text input for watermark text
- 3×3 grid for position (9 positions: top-left through bottom-right)
- Opacity slider (0-100)
- Small preview showing watermark position
- Toggle to enable/disable

- [ ] **Step 2: Wire into sidebar, commit**

---

## Task 9: Export functionality

**Files:**
- Create: `src/lib/export.ts`
- Create: `src/components/editor/controls/export-control.tsx`
- Modify: `src/components/editor/controls-sidebar.tsx` (wire in)
- Modify: `src/components/editor/editor-topbar.tsx` (trigger export)

- [ ] **Step 1: Build export utility**

`src/lib/export.ts`:
- `captureElement(element, options)` — wraps html-to-image `toPng`/`toJpeg`
- `downloadImage(dataUrl, filename, format)` — creates `<a>` and triggers download
- `copyToClipboard(dataUrl)` — writes to clipboard as blob

- [ ] **Step 2: Build export control**

- Format toggle: PNG / JPG (pill buttons)
- Scale selector: 1x / 2x / 3x (pill buttons)
- Download button (big, fun, primary gradient)
- Copy to clipboard button
- Both trigger capture of `#capture-area`

- [ ] **Step 3: Wire topbar export button**

Topbar "Export" button triggers same export flow (uses store's format/scale settings).

- [ ] **Step 4: Wire into sidebar, commit**

---

## Task 10: Polish & micro-interactions

**Files:**
- Modify: various editor components

- [ ] **Step 1: Add transitions to preview**

Smooth Framer Motion transitions when changing background, padding, radius, shadow.

- [ ] **Step 2: Upload zone polish**

Lottie-style animated icon or playful SVG illustration. Pulsing border on drag hover.

- [ ] **Step 3: Export celebration**

Brief confetti/sparkle animation on successful export.

- [ ] **Step 4: New image button**

When image is loaded, add ability to replace/clear image (small button in topbar or preview area).

- [ ] **Step 5: Final commit**
