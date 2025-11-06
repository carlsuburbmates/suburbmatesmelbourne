# 🏡 Suburbmates Homepage Design System Reference (SSOT)

**Version:** v5.2A  
**Source File:** `/client/src/pages/HomePage.tsx`  
**Design Intent:** This homepage defines the *official design system baseline* for all public-facing Suburbmates UI surfaces.  
It embodies trust through restraint, typography as hierarchy, motion with purpose, and mobile-first adaptability.

---

## 🎨 Color Tokens

| Token Name | Hex | Usage |
|-------------|------|-------|
| `--forest-900` | `#0f2a23` | Headings, hero titles, key emphasis |
| `--forest-700` | `#1e4a3b` | Primary buttons, focus rings, active states |
| `--emerald-500` | `#2ecc71` | Success and check icons |
| `--gold-400` | `#f6c324` | Featured badges, CTA highlights |
| `--stone-50` | `#f8f9fa` | Background base |
| `--stone-100` | `#f3f4f6` | Card backgrounds, subtle dividers |
| `--stone-300` | `#d1d5db` | Borders |
| `--stone-700` | `#4b5563` | Body text (14px base) |
| `--stone-900` | `#1f2937` | Secondary text emphasis |
| `--amber-400` | `#f59e0b` | Rating stars |

**Glow Policy:**  
Subtle featured glow allowed — `blur: 2px; opacity: 0.15;` on gold elements only.

---

## ✒️ Typography Scale

| Element | Tailwind Class | Size (px) | Usage |
|----------|----------------|-----------|--------|
| Hero Heading | `text-2xl sm:text-3xl font-bold` | 24–30 | Top-level titles |
| Section Heading | `text-xl font-bold` | 20 | Section titles |
| Body Text | `text-sm` | 14 | Standard paragraph text |
| Small Text / Captions | `text-xs` | 12 | Badge labels, metadata |
| Line Height | `leading-[1.5]` | — | Maintain 1.5× baseline for readability |

Typography emphasizes compact clarity, **no oversized elements**, and strict visual hierarchy.

---

## 🧭 Layout & Structure

- **Mobile-first grid:** `grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-4`
- **Touch targets:** ≥ 44 px height minimum
- **Containers:** `max-w-7xl` central layout
- **Padding scale:** `p-4` (mobile), `px-6` (tablet), `lg:px-8` (desktop)
- **Card structure:** consistent shadow-sm, rounded-lg, border-1
- **Responsive text truncation:** `truncate` classes used for overflow control

---

## ✨ Motion & Interaction System

| Layer | Motion Type | Technique | Purpose |
|--------|--------------|-----------|----------|
| **Hero Section** | Fade + y-axis lift | `initial={{ opacity: 0, y: 20 }}` | Smooth entry on load |
| **Vendor Cards** | Staggered fade-in | `whileInView`, stagger delay by 0.1s | Sequential reveal |
| **Hover Interactions** | Lift / Scale | `whileHover={{ y: -2 }}` | Subtle depth feedback |
| **CTA Buttons** | Scale feedback | `whileHover={{ scale: 1.02 }}` / `whileTap={{ scale: 0.98 }}` | Tactile click response |
| **Featured Badge** | Slow pulse | `.animate-pulse-slow` | Draw focus without distraction |
| **Reduced Motion** | Respect user setting | `@media (prefers-reduced-motion)` | Accessibility compliance |

Custom CSS for slow pulse:

```css
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## 🧱 Component Tokens (Extracted from App.jsx)

| Component  | Base Styles                                                        | Variants                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------ |
| **Button** | `rounded-md font-medium text-sm transition-all duration-200`       | `default`, `outline`, `secondary`, `ghost` |
| **Card**   | `bg-white rounded-lg border border-stone-300 shadow-sm`            | —                                          |
| **Badge**  | `inline-flex items-center rounded text-xs font-medium px-2 py-0.5` | `default`, `emerald`, `secondary`          |

Each component is self-contained, accessible, and composable.
Use these patterns to extend to `VendorCard`, `CategoryTag`, `ReviewBadge`, etc.

---

## ♿ Accessibility & Compliance

* WCAG 2.2 AA color contrast verified (min 4.5:1 for text)
* All interactive elements ≥ 44 px high
* Semantic HTML tags for sections and landmarks
* `aria-hidden="true"` for decorative icons
* `sr-only` classes for screen-reader labels
* Motion respects `prefers-reduced-motion`
* Lighthouse accessibility score target ≥ 95

---

## 📱 Performance & Core Web Vitals

| Metric  | Target   | Strategy                                         |
| ------- | -------- | ------------------------------------------------ |
| **LCP** | ≤ 2.0 s  | Preload hero image, lazy-load vendor images      |
| **INP** | ≤ 200 ms | Optimize button transitions & reduce JS blocking |
| **CLS** | ≤ 0.05   | Fixed container dimensions, reserved image space |
| **TBT** | ≤ 300 ms | Lightweight animations, minimal reflows          |

---

## 🧩 CTA Routing Rules

| CTA                    | Destination  | Notes                                  |
| ---------------------- | ------------ | -------------------------------------- |
| **Browse Directory**   | `/directory` | Public listing of all businesses       |
| **List Your Business** | `/join`      | Entry point for vendor onboarding flow |

---

## 📄 Implementation Notes

* Use `framer-motion` for all motion primitives
* No external UI library dependency (optional future shadcn migration)
* Global Tailwind + local variants for ease of testing
* Inline motion tuning supports 60 fps on mid-range devices
* Deploy as PWA-compatible page (offline ready)

---

## 🔐 Compliance with SSOT Baselines

| Category      | Requirement                 | Status   |
| ------------- | --------------------------- | -------- |
| Design Tokens | Forest/Emerald/Gold palette | ✅ Locked |
| Typography    | Small scale (14 px base)    | ✅ Locked |
| Motion        | Purposeful, non-intrusive   | ✅ Locked |
| Accessibility | WCAG 2.2 AA                 | ✅ Locked |
| Mobile-first  | Yes (touch targets, layout) | ✅ Locked |
| Performance   | Core Web Vitals met         | ✅ Locked |

---

**Maintainer:** `@carlsuburbmates`  
**Last Reviewed:** November 2025  
**Branch Context:** `feat/p5.2a-homepage-ssot`  
**Integration Target:** Merge into `phase5-step2` before `v5.2` tag  

> 🧩 *This reference acts as the Single Source of Truth for the Suburbmates public-facing UI system.*
> *All future components, landing pages, and onboarding flows should inherit from these tokens and interaction principles.*
