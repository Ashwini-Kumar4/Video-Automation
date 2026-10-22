# VidShorts — Theme & Design System Rules

## Overview
VidShorts uses a **dark-first** design system built on shadcn/ui with Tailwind CSS v4 and OKLCH color tokens. All AI agents and contributors must follow these rules when building UI components.

---

## 1. Color Palette

### Brand Colors (Custom — always use CSS variables)
| Token                    | Value (OKLCH)                  | Description                       |
|--------------------------|--------------------------------|-----------------------------------|
| `--brand-primary`        | `oklch(0.65 0.25 270)`         | Electric violet — primary CTA     |
| `--brand-primary-glow`   | `oklch(0.65 0.25 270 / 30%)`   | Glowing aura for brand primary    |
| `--brand-accent`         | `oklch(0.72 0.22 200)`         | Cyan/teal — secondary highlights  |
| `--brand-accent-glow`    | `oklch(0.72 0.22 200 / 25%)`   | Glowing aura for brand accent     |
| `--brand-gradient-start` | `oklch(0.65 0.25 270)`         | Gradient start (violet)           |
| `--brand-gradient-end`   | `oklch(0.72 0.22 200)`         | Gradient end (cyan)               |

### Surface Colors (inherited from shadcn dark theme)
- **Background**: `oklch(0.09 0 0)` — near-black base
- **Card**: `oklch(0.13 0.01 270)` — subtle dark-violet card bg
- **Border**: `oklch(1 0 0 / 8%)` — whisper-thin borders

---

## 2. Typography

### Font Stack
- **Display / Headings**: `Inter` (via `--font-sans`)
- **Body**: `Inter` regular
- **Mono / Code**: `Geist Mono` (via `--font-geist-mono`)

### Scale Rules
| Usage         | Class                              |
|---------------|------------------------------------|
| Hero H1       | `text-5xl md:text-7xl font-black`  |
| Section H2    | `text-3xl md:text-4xl font-bold`   |
| Card H3       | `text-xl font-semibold`            |
| Body          | `text-base text-muted-foreground`  |
| Caption/Label | `text-sm text-muted-foreground`    |

### Gradient Text
Use the brand gradient for hero headlines:
```tsx
className="bg-gradient-to-r from-[oklch(0.65_0.25_270)] to-[oklch(0.72_0.22_200)] bg-clip-text text-transparent"
```

---

## 3. Spacing & Layout

- **Max content width**: `max-w-7xl mx-auto`
- **Section padding**: `py-20 md:py-28 px-6`
- **Card padding**: `p-6 md:p-8`
- **Gap between cards**: `gap-6 md:gap-8`

---

## 4. Border Radius

Use the shadcn radius scale:
- `rounded-xl` — cards, panels
- `rounded-2xl` — featured/hero cards
- `rounded-full` — badges, pills, avatars

---

## 5. Glassmorphism

For floating/overlay cards, apply glass effect:
```tsx
className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
```

---

## 6. Shadows & Glows

Brand glow for CTAs and active elements:
```tsx
// Violet glow
style={{ boxShadow: "0 0 32px oklch(0.65 0.25 270 / 35%)" }}

// Cyan glow
style={{ boxShadow: "0 0 32px oklch(0.72 0.22 200 / 30%)" }}
```

---

## 7. Animations

| Animation         | Usage                                      |
|-------------------|--------------------------------------------|
| `animate-fade-in` | Page sections on mount                     |
| Hover scale       | `hover:scale-105 transition-transform`     |
| Hover glow        | `hover:shadow-[brand-glow] transition-all` |
| Shimmer           | Skeleton loaders / loading states          |

Use `transition-all duration-300 ease-out` as default transition.

---

## 8. Buttons

### Primary CTA
```tsx
<Button className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold px-8 py-3 rounded-full hover:scale-105 transition-all">
  Get Started
</Button>
```

### Secondary / Ghost
```tsx
<Button variant="outline" className="border-white/20 hover:bg-white/10">
  Learn More
</Button>
```

---

## 9. Dark Theme Enforcement

- **Always** render with `dark` class on `<html>`. Set it in `layout.tsx`.
- Never use light-mode-only color hardcodes (`white`, `black`).
- Prefer `bg-background`, `text-foreground`, `border-border` Tailwind tokens.
- Use `text-muted-foreground` for secondary text, never raw `gray-*`.

---

## 10. Icon Library

Use **Lucide React** exclusively:
```tsx
import { Sparkles, Zap, Video } from "lucide-react"
```

Icon sizing:
- Inline with text: `size-4`
- Feature icons: `size-6` or `size-8`
- Hero icons: `size-10` or `size-12`

---

## 11. Component Patterns

### Feature Card
```tsx
<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-violet-500/40 hover:bg-white/8 transition-all duration-300">
  <div className="size-12 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mb-4">
    <Icon className="size-6 text-white" />
  </div>
  <h3 className="text-xl font-semibold mb-2">Feature Title</h3>
  <p className="text-muted-foreground text-sm">Description text.</p>
</div>
```

### Pricing Card (Featured)
```tsx
<div className="relative border-2 border-violet-500 rounded-2xl p-8 bg-violet-500/10">
  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
    <Badge>Most Popular</Badge>
  </div>
  ...
</div>
```

---

## 12. Agent Rules (Enforced)

1. **Always use dark theme**: Set `dark` class on `<html>` in layout.
2. **Brand gradient**: Use violet->cyan gradient for primary accents.
3. **No plain colors**: Avoid plain red/blue/green. Use OKLCH or Tailwind palette.
4. **Glassmorphism**: Use `bg-white/[n] backdrop-blur` for elevated surfaces.
5. **Micro-animations**: Every interactive element must have a hover/focus transition.
6. **shadcn components**: Always prefer shadcn primitives over raw HTML.
7. **Lucide icons**: Always use Lucide React for icons.
8. **Responsive**: All layouts must be responsive (mobile-first with `md:` breakpoints).
9. **Semantic HTML**: Use `<header>`, `<main>`, `<section>`, `<footer>` properly.
10. **Google Fonts**: Use Inter or Outfit for headings; never use browser defaults.
