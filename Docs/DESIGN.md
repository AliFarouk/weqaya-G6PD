---
name: Weqaya G6PD
colors:
  surface: '#fcf8ff'
  surface-dim: '#d8d6ff'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#efecff'
  surface-container-high: '#e8e5ff'
  surface-container-highest: '#e2dfff'
  on-surface: '#161640'
  on-surface-variant: '#454653'
  inverse-surface: '#2c2c56'
  inverse-on-surface: '#f2efff'
  outline: '#757685'
  outline-variant: '#c5c5d5'
  surface-tint: '#3f53c4'
  primary: '#3c51c2'
  on-primary: '#ffffff'
  primary-container: '#566bdc'
  on-primary-container: '#fffbff'
  inverse-primary: '#bac3ff'
  secondary: '#006d44'
  on-secondary: '#ffffff'
  secondary-container: '#68fdb3'
  on-secondary-container: '#007349'
  tertiary: '#b90039'
  on-tertiary: '#ffffff'
  tertiary-container: '#e0244e'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee0ff'
  primary-fixed-dim: '#bac3ff'
  on-primary-fixed: '#00105c'
  on-primary-fixed-variant: '#2339ab'
  secondary-fixed: '#68fdb3'
  secondary-fixed-dim: '#46e099'
  on-secondary-fixed: '#002111'
  on-secondary-fixed-variant: '#005232'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000e'
  on-tertiary-fixed-variant: '#91002b'
  background: '#fcf8ff'
  on-background: '#161640'
  surface-variant: '#e2dfff'
typography:
  display:
    fontFamily: Cairo
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 52px
  headline-lg:
    fontFamily: Cairo
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 42px
  headline-lg-mobile:
    fontFamily: Cairo
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Cairo
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 34px
  headline-sm:
    fontFamily: Cairo
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Cairo
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Tajawal
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Tajawal
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: Tajawal
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 22px
  label-lg:
    fontFamily: Tajawal
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 22px
  label-md:
    fontFamily: Tajawal
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Tajawal
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system is crafted specifically for Arab and Egyptian families navigating Glucose-6-Phosphate Dehydrogenase (G6PD) deficiency (Favism / أنيميا الفول). It prioritizes emotional calm, authoritative medical clarity, and immediate safety communication. The aesthetic blends modern healthcare minimalism with empathetic, tactile warmth—countering parental panic and medical jargon with clear visual guidance, decisive risk-tier indicators, and approachable Arabic typography.

The interface is engineered natively for right-to-left (RTL) reading flows. Layouts rely on structural clarity, generous breathing room, and soft micro-surfaces that reduce cognitive load during critical moments—such as checking whether a medicine or food ingredient triggers acute hemolysis.

## Colors

The color palette centers on safety discernment and clinical trust:

- **Primary (`#5E72E4` - Trust Blue/Indigo):** Used for primary navigation, actionable medical cards, trusted source badges, and core UI controls.
- **Secondary (`#2DCE89` - Safe Calming Green):** Denotes verified safe foods, safe therapeutic alternatives, normal screening results, and confirmed community tips.
- **Tertiary (`#F5365C` - Hemolysis Danger Red):** Reserved exclusively for high-risk alerts: banned medications, forbidden legumes, crisis hotlines, and severe hemolytic reaction warnings.
- **Neutral Titles & Text (`#32325D` - Slate Dark):** Provides high-contrast, non-harsh readability for Arabic typography on light backgrounds.
- **Muted Supporting Tone (`#8898AA` - Muted Slate Gray):** Handles secondary metadata, dates, ingredient scientific classifications, and inactive state borders.
- **Canvas Base (`#F8F9FE` - Calm Ultra-Light):** Soft ambient foundation that avoids clinical starkness while ensuring colored badges and elevated cards remain distinct.

## Typography

The typography stack pairs **Cairo** for bold, balanced headings with **Tajawal** for fluid, highly legible Arabic body and label copy.

- **RTL Baseline Alignment:** Font sizes and line-heights are explicitly tuned for Arabic glyph ascenders and descenders to avoid clipping in compact cards and badges.
- **Hierarchy Rules:** `Cairo` provides strong architectural anchors for compound Arabic medication names, food directory entries, and emergency alerts. `Tajawal` brings warm, open counter-forms suited for long-form symptom guidelines and community advice.
- **Letter Spacing:** Arabic script strictly avoids positive letter-spacing (`tracking: 0`) to preserve natural cursive stroke connections.

## Layout & Spacing

The layout is built upon a responsive 12-column grid designed for bidirectional adaptability, with native right-to-left layout order:

- **Mobile (< 768px):** 4 columns, 16px margins, 16px gutters. Single-column stacked cards ensure fast thumb triage during emergency food or medication lookup.
- **Tablet (768px – 1024px):** 8 columns, 32px margins, 24px gutters. Dual-pane layout pairing dietary search and filter chips with detailed medical advisories.
- **Desktop (> 1024px):** 12 columns, max-width 1240px centered, 48px margins, 32px gutters. Allows permanent side navigation, main safety directory streams, and verified clinic contact sidebars.

Spacing inside cards strictly preserves hierarchical group relationships: small spacing (`space-xs`, `space-sm`) separates Arabic labels from parent values; moderate spacing (`space-md`, `space-lg`) bounds interactive target regions.

## Elevation & Depth

Visual hierarchy uses ambient tinted shadows that feel gentle rather than harsh, avoiding clinical tension:

- **Surface Neutral (`Level 0`):** Solid `#FFFFFF` on `#F8F9FE` canvas without shadow, delineated by subtle 1px border `rgba(136, 152, 170, 0.15)`.
- **Resting Card Elevation (`Level 1`):** `0 4px 18px -2px rgba(50, 50, 93, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)`. Used for standard directory entries, food safety cards, and doctor listings.
- **Interactive Hover & Drawer Elevation (`Level 2`):** `0 10px 30px -5px rgba(50, 50, 93, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.06)`. Used for active medication inspection overlays, search dropdowns, and elevated bottom sheets on mobile.
- **Danger Warning Popout (`Critical Elevation`):** `0 8px 24px -4px rgba(245, 54, 92, 0.18)`. Tinted shadow applied strictly to critical contraindication banners and emergency contact floats.

## Shapes

The shape system employs soft, welcoming radii calibrated to 14px–16px (`rounded-lg` at 1rem / 16px) across cards, inputs, and safety badges:

- **Primary Cards & Modals:** 16px corner radius (`rounded-lg`) creates an approachable, non-institutional aesthetic that puts worried parents at ease.
- **Buttons & Control Inputs:** 12px corner radius (`rounded-md` equivalent to 0.75rem) provides clear touch targets with soft edges.
- **Status Pills & Risk Tags:** Full pill radius (`rounded-full`) for high-contrast safety tags ("آمن" / Safe, "ممنوع قطعيًا" / Strictly Forbidden).

## Components

### Buttons
- **Primary:** Background `#5E72E4`, label text `#FFFFFF`, font `Cairo` 600. 12px border radius, 12px 24px padding. Hover subtle lift with `Level 2` shadow.
- **Danger Action (Emergency / Report Trigger):** Background `#F5365C`, label text `#FFFFFF`, font `Cairo` 600.
- **Safe Confirm / Alternative Found:** Background `#2DCE89`, text `#FFFFFF`.
- **Secondary / Ghost:** Transparent background, 1.5px border `#8898AA`, text `#32325D`.

### Risk & Safety Badges (Pills)
- **High Danger (ممنوع / Hemolysis Hazard):** Background `rgba(245, 54, 92, 0.12)`, text `#F5365C`, border `1px solid rgba(245, 54, 92, 0.3)`. Contains warning icon leading on the right (RTL).
- **Safe Alternative (آمن للمصابين):** Background `rgba(45, 206, 137, 0.12)`, text `#2DCE89`, border `1px solid rgba(45, 206, 137, 0.3)`.
- **Caution / Under Review (بحذر وتحت إشراف):** Background `rgba(251, 99, 64, 0.12)`, text `#FB6340`, border `1px solid rgba(251, 99, 64, 0.3)`.

### Cards (Directory & Ingredient Cards)
- **Base Structure:** `#FFFFFF` background, 16px radius, `Level 1` elevation, 20px padding.
- **RTL Orientation:** Visual indicator strip (4px width) anchored on the right edge: Red for prohibited drugs (e.g., Primaquine, Nitrofurantoin), Green for tested safe items, Trust Blue for general advice.
- **Card Content:** Egyptian & Arabic common names in `Cairo` Headline-sm, pharmaceutical/scientific names beneath in `Tajawal` Body-sm using `#8898AA`.

### Search & Filter Inputs
- **Directory Search Field:** Height 52px, `#FFFFFF` background, 12px radius, right-aligned search icon with 16px RTL inset. Placeholder in `#8898AA` `Tajawal`. Border transition to `#5E72E4` on focus with subtle outer glow.
- **Filter Chips:** 36px height, rounded-full pill shape. Inactive: `#FFFFFF` with `#8898AA` border; Active: `#5E72E4` background with `#FFFFFF` text.

### Emergency Fast-Bar
- Fixed or top-banner alert component in solid `#F5365C` with white text, providing instant access to emergency hospital protocol guides and pediatric G6PD transfusion guidelines across Egyptian governorates.