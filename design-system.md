# Celebration Food Cafe — Design System & Style Guide

This document serves as the **single source-of-truth reference** for all present and future pages (*Menu*, *Our Story*, *Login*, *Cart*, *Order Checkout*, *Admin Dashboard*). It documents the exact color palette, typography scales, spacing tokens, component patterns, animation physics, and layout standards established on the homepage.

---

## 1. Color Palette

### Base Brand Palette
| Color Role | Hex Code | Description & Usage |
| :--- | :--- | :--- |
| **Forest Green Header** | `#3B4A2F` | Top organic SVG wave & header navbar container background |
| **Forest Green Secondary** | `#4A5B3C` | Overlay SVG wave path (opacity 0.55) |
| **Dark Pine Green** | `#1F3B2C` / `#152A1F` | Feature showcase background & dark primary accents |
| **Hero Cream Background** | `#F4E4C0` | Main warm organic earthy hero canvas |
| **Off-White Canvas** | `#FAF7F0` | Default body canvas, bestseller carousel, search containers |
| **Card Fill Cream** | `#F5EFE6` | Chef's showcase background & secondary card surface fill |
| **Terracotta Brown** | `#8B4D2A` | Bottom SVG organic wave fill & eyebrow text |
| **Terracotta Light** | `#A05A35` | Secondary bottom wave path overlay (opacity 0.55) |

### Accent & Highlights
| Color Role | Hex Code | Description & Usage |
| :--- | :--- | :--- |
| **Terracotta Orange** | `#C4622D` | Primary pill CTA buttons, floating stickers, active tab indicators |
| **Marigold Gold** | `#E8A93B` | Star rating stars, highlight accents |
| **Marigold Light** | `#F2C572` | Secondary gold accents & rating badge highlights |

### Text Color Hierarchy
| Role | Color / Hex | Tailwind / CSS Rule |
| :--- | :--- | :--- |
| **Main Headings** | `#2A1508` | Rich dark espresso brown (`color: #2A1508`) |
| **Body / Subtitles** | `#6B4226` | Warm dark amber brown (`color: #6B4226`) |
| **Eyebrows / Labels** | `#8B4D2A` | Uppercase letter-spaced terracotta brown (`text-[#8B4D2A]`) |
| **Light Text** | `#F4E4C0` | Warm cream text on dark green/terracotta surfaces |

### Card Overlay & Image Gradients
- **Bottom Image Fade**: `bg-gradient-to-t from-black/85 via-black/35 to-transparent`
- **Frosted Glass Pills**: `bg-[#FAF7F0]/95 backdrop-blur-md border border-[#C4622D]/35 shadow-lg`

---

## 2. Typography

### Font Families
- **Heading / Display**: `"Nunito", "Fraunces", Georgia, serif` (`font-heading` / `font-display`)
- **Body / UI Controls**: `"Inter", "Nunito", system-ui, sans-serif` (`font-body` / `font-sans`)

### Font Weights
- **900 (`font-black`)**: Main hero headline & background watermark wordmark
- **800 (`font-extrabold`)**: Primary CTA buttons, sticker badges, section titles
- **700 (`font-bold`)**: Card titles, eyebrows, rating text, prices
- **500 (`font-medium`)**: Body text, descriptions, navigation links
- **400 (`font-normal`)**: Helper text, muted captions

### Type Scale Across Breakpoints
| Element | Font Size Specification | Line Height & Tracking |
| :--- | :--- | :--- |
| **Hero Watermark** | `clamp(90px, 18vw, 320px)` | `line-height: 1`, `tracking-[-0.025em]` |
| **Hero Main Headline** | `clamp(2.1rem, 4.5vw, 4rem)` | `line-height: 1.08`, `tracking-[-0.02em]` |
| **Section Headings (H2)**| `text-3xl md:text-5xl` | `line-height: 1.1`, `font-bold` |
| **Card Headings (H3)** | `text-xl lg:text-2xl` | `line-height: 1.2`, `font-bold` |
| **Body Copy** | `text-sm md:text-base` | `line-height: 1.7` / `leading-relaxed` |
| **Eyebrows / Badges** | `text-[0.72rem]` / `text-xs` | `tracking-[0.32em]`, `uppercase` |

---

## 3. Spacing Scale

### Section Spacing
- **Hero Section**: `pt-24 lg:pt-28 pb-20 lg:pb-24 px-4 sm:px-6`
- **Standard Content Block**: `py-20 px-6 max-w-6xl mx-auto`
- **Header Navbar Container**: `py-3 px-4 sm:px-8 max-w-7xl mx-auto`

### Container Padding & Gaps
- **Card Padding**: `p-6` (small) / `p-8 lg:p-10` (showcase)
- **Grid Gap Scale**: `gap-4` (compact) / `gap-6` (medium) / `gap-8` (large)
- **Flex Micro Gap**: `gap-2` (icon + text) / `gap-3` (buttons)

---

## 4. Component Patterns

### 1. Badge & Sticker Patterns
- **Pill Shape**: `rounded-full`
- **Terracotta Sticker Badge**:
  ```tsx
  className="bg-[#C4622D] text-[#F4E4C0] font-heading font-extrabold text-xs sm:text-sm tracking-widest uppercase px-4 py-2 rounded-full shadow-xl border border-white/20 whitespace-nowrap"
  ```
- **Star Rating Badge**:
  ```tsx
  className="bg-[#FAF7F0] backdrop-blur-md px-5 py-2 rounded-full border border-[#C4622D]/35 shadow-[0_6px_22px_rgba(42,21,8,0.18)] inline-flex items-center gap-2.5"
  ```

### 2. Card Patterns
- **Rounded Corners**: `rounded-3xl` (`1.5rem` to `2rem`)
- **Image Card Overlay**: `bg-gradient-to-t from-black/85 via-black/35 to-transparent`
- **Hover Behavior**: `hover:scale-105 transition-transform duration-500 shadow-xl hover:shadow-2xl`

### 3. Button Patterns
- **Primary CTA**:
  ```tsx
  className="bg-[#C4622D] text-[#F4E4C0] font-heading font-extrabold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-[0_6px_24px_rgba(196,98,45,0.42)] transition-all duration-300 hover:brightness-110 flex items-center gap-2"
  ```
- **Secondary Link CTA**:
  ```tsx
  className="group relative transition-opacity duration-200 hover:opacity-100 flex items-center gap-1 py-1 text-[#2A1508] font-heading font-bold text-sm opacity-80"
  ```
  *(With an animated underline `scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300`)*.

### 4. Icon Container Patterns
- **Translucent Rounded Square**:
  ```tsx
  className="w-12 h-12 rounded-2xl bg-[#C4622D]/20 border border-[#C4622D]/40 flex items-center justify-center text-[#F4E4C0]"
  ```

---

## 5. Animation & Motion Tokens

### Mouse Parallax Physics (`useSpring`)
- **Config**: `{ stiffness: 50, damping: 20, mass: 0.5 }`
- **Layer Ranges**:
  - Wordmark: `±5px`
  - Hero Content: `±8px`
  - Left Drink Cutout: `±18px` (opposite direction)
  - Right Pizza Cutout: `±28px` (direct direction)
  - Sticker Rotation: `±2.5deg`
  - Decorators: `±38px`

### Emil Kowalski Design Engineering Micro-Interactions
- **Tab Background Spring**: `{ type: "spring", bounce: 0.15, duration: 0.35 }`
- **Tactile Press Feedback**: `whileTap={{ scale: 0.95 }}` / `whileTap={{ scale: 0.96 }}`
- **Hover Scale**: `whileHover={{ scale: 1.04-1.05 }}`

### Staggered Load Entrance Sequence
- **Container**: `staggerChildren: 0.12, delayChildren: 0.1`
- **Fade Up**: `y: 22 -> 0, opacity: 0 -> 1` (`duration: 0.6, ease: [0.22, 1, 0.36, 1]`)
- **Cutout Slide In**: `x: -100` / `100 -> 0`, `rotate: -14deg` / `14deg -> -8deg` / `8deg` (`duration: 0.85`)

### Continuous Idle Motion Loops
- **Rating / Badge Float**: `animate={{ y: [0, -4, 0] }}` (`duration: 3s`, `ease: "easeInOut"`, `repeat: Infinity`)
- **Ambient Decorators**: Drift & rotate over `8s-15s`

---

## 6. Layout Patterns & Color Transitions

### Alternating Section Flow
1. **Top Header**: Forest Green (`#3B4A2F`)
2. **Hero Banner**: Warm Cream (`#F4E4C0`) with Top Forest Green Organic Wave & Bottom Terracotta Brown Organic Wave
3. **Service Strip**: Warm Off-White (`#FAF7F0`) with border-y
4. **Bestsellers Section**: Warm Off-White (`#FAF7F0`)
5. **Chef's Showcase Section**: Secondary Cream Fill (`#F5EFE6`)
6. **Feature Highlights Section**: Forest Green (`#3B4A2F`)

---

*Code implementation tokens are available in [lib/tokens.ts](file:///d:/Celebration%20Food%20Cafe/celebration-cafe/lib/tokens.ts).*
