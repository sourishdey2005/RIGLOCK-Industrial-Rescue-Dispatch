---
name: Industrial Rescue
colors:
  surface: '#131410'
  surface-dim: '#131410'
  surface-bright: '#3a3935'
  surface-container-lowest: '#0e0e0b'
  surface-container-low: '#1c1c18'
  surface-container: '#20201c'
  surface-container-high: '#2a2a26'
  surface-container-highest: '#353530'
  on-surface: '#e5e2db'
  on-surface-variant: '#e4beb3'
  inverse-surface: '#e5e2db'
  inverse-on-surface: '#31312c'
  outline: '#ab897f'
  outline-variant: '#5b4038'
  surface-tint: '#ffb59e'
  primary: '#ffb59e'
  on-primary: '#5e1700'
  primary-container: '#ff5a1f'
  on-primary-container: '#541400'
  inverse-primary: '#ae3200'
  secondary: '#bdf532'
  on-secondary: '#263500'
  secondary-container: '#a2d801'
  on-secondary-container: '#425a00'
  tertiary: '#ffb4ab'
  on-tertiary: '#690005'
  tertiary-container: '#ff574d'
  on-tertiary-container: '#5e0004'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#3a0b00'
  on-primary-fixed-variant: '#852400'
  secondary-fixed: '#bdf532'
  secondary-fixed-dim: '#a2d801'
  on-secondary-fixed: '#141f00'
  on-secondary-fixed-variant: '#384e00'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ab'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#93000b'
  background: '#131410'
  on-background: '#e5e2db'
  surface-variant: '#353530'
typography:
  headline-xl:
    fontFamily: Bebas Neue
    fontSize: 56px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: 0.04em
  headline-xl-mobile:
    fontFamily: Bebas Neue
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 38px
    letterSpacing: 0.03em
  headline-lg:
    fontFamily: Bebas Neue
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 42px
    letterSpacing: 0.03em
  headline-lg-mobile:
    fontFamily: Bebas Neue
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 30px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Bebas Neue
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.02em
  headline-sm:
    fontFamily: Bebas Neue
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Chivo
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Chivo
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Chivo
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.05em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.08em
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system delivers an emergency-grade, utilitarian marketplace identity rooted in tactical response consoles, high-stakes telemetry dashboards, and industrial dispatch operations. Designed for high-stress triage situations where contractors, engineers, and first-response technicians require immediate hardware dispatch, the aesthetic strips away decorative ambiguity in favor of mission-critical clarity.

The emotional signature is visceral urgency paired with absolute procedural reliability. Every element looks stamped, calibrated, and mechanically actuated. The interface operates as an electronic incident board: structural framing, tactical crosshairs, and high-visibility status pings replace generic SaaS softness. High contrast, precise layout divisions, and immediate visual hierarchy prioritize rapid physical action over passive contemplation.

## Colors

The palette operates under tactical containment rules:

- **Primary Action (Signal Orange - `#FF5A1F`):** Used strictly for direct dispatch interventions, mission confirm actions, and primary interactive commitments.
- **Secondary (Safety Lime - `#C6FF3D`):** Strictly reserved for dynamic telemetry: verified active nodes, live couriers in-flight, online hardware availability, and operational clearance.
- **Tertiary (Alert Red - `#FF2E2E`):** Critical system exceptions, hardware breakdown warnings, countdown expirations, and emergency override states. Never used decoratively.
- **Neutral Canvas & Surfaces:** Grounded in Deep Charcoal (`#121212`) for base backdrops, stepping up to Dark Slate tiers (`#1A1A1A` for base panels, `#242424` for elevated modules, `#2A2A2A` for structural bounding tracks).
- **Text & Stamp Accent (Off-White Paper - `#F4F1EA`):** High-contrast textual baseline mimicking industrial stencil prints and technical spec readouts. Muted technical metadata falls back to mid-slate `#8E8D88`.

## Typography

Typography functions as an industrial naming and read-out protocol:

- **Display & Headlines (Bebas Neue):** Tall, architectural, and imperative. Set in uppercase across all headers, status flags, and primary equipment categories. Letter spacing is slightly decoupled to preserve legibility under rapid glance conditions.
- **Telemetry, Timers, Readouts & Labels (JetBrains Mono):** Applied to all technical metrics: ETAs, countdown clocks, GPS coordinates, serial numbers, radial measurements, and price logs. Ensures tabular numeric alignment across fluctuating real-time streams.
- **Instructional & Body Copy (Chivo):** A sharp, neutral grotesque chosen for immediate legibility in variable light conditions. Retains clarity even at compressed sizes within dispatch detail logs.

## Layout & Spacing

The layout is structured around an industrial control grid. The structural philosophy adheres strictly to a fluid modular matrix:

- **Grid Architecture:** 12-column dynamic framework on desktop platforms with structured 24px gutters; refactoring into 6 columns on tablet devices (16px gutters), and a 4-column stack on mobile devices (16px gutters).
- **Rhythm & Padding:** Spacing tokens prioritize rigid, high-density groupings. Related operational parameters cluster closely (`space-xs` to `space-sm`), while tactical modules and dispatch cards separate with strict uniform bounds (`space-lg` to `space-xl`).
- **Tactical Overlays:** Grid canvas edges feature non-obtrusive blueprint alignment marks, corner target ticks, and modular dividing lines that segment the viewport into distinct telemetry panels.

## Elevation & Depth

This system outright rejects blurred atmospheric dropshadows, diffuse ambient glows, and translucent glass layers. Depth is strictly physical, mechanical, and tectonic:

- **Hard-Edge Drop Shadows:** Raised elements project a solid 4px horizontal and vertical offset shadow (`#000000` or `#0D0D0D`) with `0px` blur. When elements are depressed or activated, the offset collapses to `0px 0px`, physically simulating a heavy mechanical switch snapping into a chassis.
- **Layered Metal Plates:** Surface hierarchy relies on step-up panel values (`#121212` canvas base to `#1A1A1A` plate, up to `#242424` active console tier), bound by crisp 2px solid perimeter rules (`#2A2A2A`).
- **Tactile Texture & Stencils:** Halftone dot grids identify secondary utility fields. Subtly etched technical crosshairs (+, ⌖) mark panel intersections and map coordinates to reinforce the functional ER hardware depot environment.

## Shapes

The design language uses zero-radius geometry (`0px` roundedness across all elements). Curves, rounded pills, and soft organic shapes are strictly prohibited. 

Interactive tags, buttons, inputs, segmented controls, and modal overlays are clean rectangles with crisp 90-degree corners. Beveled or 45-degree chamfered corner notches are permitted exclusively on primary action container caps and high-urgency diagnostic tags to mimic physical heavy-machinery faceplates.

## Components

### Buttons & Mechanical Push States
- **Primary Dispatch Button:** Solid Signal Orange (`#FF5A1F`) surface, JetBrains Mono or Bebas Neue bold text in `#121212`, framed with a 2px solid `#0D0D0D` border and a 4px 4px hard drop shadow (`#000000`). Hover elevates text brightness. Active/pressed state translates the element 4px diagonally down and right while setting the shadow to `0px 0px`, providing physical actuation feedback.
- **Secondary / Abort Button:** Matte Slate (`#1A1A1A`) with Off-White (`#F4F1EA`) border, white text, and a matching 4px hard black shadow.
- **Emergency Override:** Tertiary Red (`#FF2E2E`) background with warning diagonal hatch border.

### Status Badges & Chips
- **Halftone Live Indicator:** Compact, zero-radius tag with a dotted technical halftone field. Safety Lime (`#C6FF3D`) background with dark `#121212` text indicates "LIVE NODE" or "IN VEHICLE".
- **Critical Alert Chip:** Signal Red (`#FF2E2E`) outline with blinking monospace system status ("CRITICAL DISPATCH").

### Trust Stack Micro-Component
- A unified mechanical cluster for supplier nodes:
  1. Shield badge displaying deposit security tier.
  2. Numerical star verification in JetBrains Mono (`4.98 / 5.00`).
  3. Last active telemetry timestamp (`PING: 12s AGO`).
  4. Radial geodesic distance metric (`0.8 MILES`).
  Contained within a single 2px `#2A2A2A` bordered block with internal hair-thin separators.

### Split-Flap Mode Toggles
- Physical split-flap mechanical aesthetics used for primary mode switches (e.g., `[ EMERGENCY: NOW ]` vs `[ PROJECT: RENTAL ]`).
- Inactive side features a dark slate textured plate with recessed typography; active side is stamped in high-contrast Signal Orange or Off-White Paper with an inverted color scheme and an illuminated status pip.

### Launch Dial Countdown Ring
- A radial timer gauge inspired by launch sequence instrumentation.
- Displays a prominent 45-minute countdown for rapid ER dispatch.
- Outer ring utilizes segmented tick marks that extinguish as time elapses, with central readouts rendered in oversized JetBrains Mono numerals accompanied by micro millisecond tracking.

### Input Fields & Selectors
- Solid `#1A1A1A` background encased in a 2px `#2A2A2A` border. Focus state replaces the border with a 2px Safety Lime or Signal Orange line accompanied by an immediate 2px hard shadow offset. Placeholders are rendered in subdued monospace uppercase.

### Cards & Telemetry Panels
- Modular equipment triage boxes with technical header strips containing SKU, condition rating, and availability flags. Background is dark slate (`#1A1A1A`), delineated by a 2px border with corner coordinate stamps.