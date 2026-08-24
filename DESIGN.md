---
name: Skills Hub
description: A light, orderly local workbench for managing AI agent skills.
colors:
  background: "oklch(97.5% 0.004 240)"
  surface: "oklch(100% 0 0)"
  surface-subtle: "oklch(96% 0.004 240)"
  surface-muted: "oklch(93% 0.006 240)"
  text-primary: "oklch(20% 0.02 240)"
  text-secondary: "oklch(50% 0.018 240)"
  text-tertiary: "oklch(62% 0.014 240)"
  border-subtle: "oklch(90% 0.006 240)"
  border-strong: "oklch(85% 0.008 240)"
  primary: "oklch(56% 0.12 170)"
  primary-strong: "oklch(48% 0.14 170)"
  custom-warm: "oklch(62% 0.06 55)"
  success: "oklch(55% 0.12 145)"
  warning: "oklch(60% 0.14 75)"
  error: "oklch(52% 0.14 30)"
typography:
  display:
    fontFamily: "Avenir Next, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Avenir Next, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Avenir Next, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"
  mono:
    fontFamily: "JetBrains Mono, SF Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "28px"
  4xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
  button-soft:
    backgroundColor: "color-mix(in oklch, {colors.primary} 10%, transparent)"
    textColor: "{colors.primary-strong}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  search-field:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "36px"
  filter-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    rounded: "20px"
    padding: "6px 14px"
  filter-chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "20px"
    padding: "6px 14px"
  skill-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "18px"
---

# Design System: Skills Hub

## Overview

**Creative North Star: "The Agent Workbench｜Agent 工作台"**

Skills Hub should feel like a well-kept workbench for people who move between several AI agents: tools are close at hand, states are immediately legible, and nothing decorative competes with the next action. The atmosphere is light, friendly, and orderly, with generous cool-white surfaces and one disciplined sync-green accent.

The interface is compact enough for real operational density but avoids terminal austerity. Fine borders, calm neutral layers, and concise type create structure; refined, restrained components keep the product approachable without making it playful. The system remains flat at rest and earns depth only when interaction or overlay hierarchy requires it.

**Key Characteristics:**

- Cool, nearly white tonal layering with one sync-green accent.
- Crisp borders and a two-radius shape system.
- Compact desktop density with a comfortable 8–28px rhythm.
- Flat at rest; ambient lift is reserved for hover and overlays.
- Friendly, precise components with restrained motion and practical copy.

## Colors

The palette pairs cool mist backgrounds and clean white work surfaces with dark ink text and a single synchronization green; warm and semantic hues appear only when data meaning requires them.

### Primary

- **同步青绿** (`{colors.primary}`): Primary actions, selected filters, active view controls, and other moments that initiate or confirm synchronization-oriented work.
- **深同步青绿** (`{colors.primary-strong}`): Hover emphasis, active navigation text, and stronger contrast where the primary accent sits on a pale tint.

### Secondary

- **自研暖金** (`{colors.custom-warm}`): The warm semantic cue for custom or self-authored skills; it is categorical, not decorative.

### Tertiary

- **成功绿** (`{colors.success}`): Installed, saved, online, and completed states.
- **警示琥珀** (`{colors.warning}`): Drifted, pending, modified, or attention-required states.
- **错误赤褐** (`{colors.error}`): Broken, inaccessible, destructive, and failed states.

### Neutral

- **冷雾背景** (`{colors.background}`): The application canvas behind all work surfaces.
- **纯白工作面** (`{colors.surface}`): Sidebar, top bar, cards, panels, dialogs, and editor surfaces.
- **浅冷雾层** (`{colors.surface-subtle}`): Inputs, hover fills, soft controls, and secondary tonal grouping.
- **沉静冷灰层** (`{colors.surface-muted}`): Quiet badges and tertiary grouping.
- **墨黑文本** (`{colors.text-primary}`): Primary copy, headings, values, and active information.
- **中灰文本** (`{colors.text-secondary}`): Secondary descriptions and inactive navigation.
- **淡灰文本** (`{colors.text-tertiary}`): Metadata, placeholders, captions, and low-priority icons.
- **细雾边框** (`{colors.border-subtle}`): Default structural borders and dividers.
- **强调边框** (`{colors.border-strong}`): Hovered or elevated structural borders.

**The Sync Green Rule.** Synchronization green marks primary action, active selection, or confirmed product state; it does not become a large decorative field.

**The Semantic Color Rule.** Warm, success, warning, and error colors always carry explicit meaning and must be paired with text, iconography, or state labels.

## Typography

**Display Font:** Avenir Next (with Apple system and `system-ui` fallbacks)  
**Body Font:** Apple system / SF Pro Text (with `system-ui` fallback)  
**Label/Mono Font:** JetBrains Mono (with SF Mono and `ui-monospace` fallbacks)

**Character:** Avenir Next gives headings and dashboard figures a composed, approachable clarity. The system body stack stays invisible and efficient, while monospaced type is reserved for paths, filenames, editor content, and other filesystem facts.

### Hierarchy

- **Display** (700, `32px`, `1`): Dashboard totals and other high-priority numeric values.
- **Headline** (700, `22px`, `1.2`): Page and settings-panel headings.
- **Title** (700, `18px`, `1`): Section headings; smaller component titles use the same display family at 14–16px and weight 600–700.
- **Body** (400, `15px`, `1.5`): Default interface copy; long rendered descriptions expand to `1.7` and remain near 72 characters per line.
- **Label** (600, `12px`, `0.06em`, uppercase): Compact dashboard labels, panel labels, and file-group headings.
- **Mono** (400, `13px`, `1.7`): Editable instructions and code-like content; compact metadata may step down to 11–12px.

**The Role Clarity Rule.** Display type identifies hierarchy, body type carries interface language, and mono type signals literal filesystem or code content; never swap these roles for decoration.

## Layout

The primary desktop shell fills the viewport. A fixed 240px sidebar anchors navigation, a 60px top bar holds search and global actions, and the main content scrolls independently with 24px vertical and 28px horizontal padding. The dashboard uses a four-column statistics grid with 16px gaps, then a wrapping filter rail and an auto-filling skill grid whose cards never shrink below 320px. List view uses compact 12px × 16px rows for higher scanning density.

Operational surfaces keep their own stable rails: the instruction editor uses a 260px file panel, settings use a 200px local navigation rail and a content column capped at 780px, and detail content is capped near 900px. Cards generally use 14–24px internal padding; 8, 12, 16, 20, 24, and 28px are the dominant rhythm steps.

At 900px and below, the primary sidebar disappears and dashboard statistics collapse to two columns. At 640px and below, statistics and skill grids become single-column, content padding becomes 16px, settings navigation disappears, and complex cards stack. The editor file rail narrows to 200px below 800px and disappears below 600px. Responsive behavior preserves task completion and scanning rather than reproducing the desktop chrome at smaller sizes.

**The Stable Rails Rule.** Persistent navigation and file rails own fixed widths on desktop; content areas flex and scroll without shifting those anchors.

**The Working Density Rule.** Prefer compact repeated rows for comparison and modestly padded cards for inspection; do not inflate routine operational content into marketing-scale whitespace.

## Elevation & Depth

The system is flat by default. White surfaces are separated from the cold-mist canvas through thin borders and tonal contrast, not permanent drop shadows. A low ambient shadow appears on hovered cards and rows, while a broader soft shadow is reserved for modals, confirmations, toasts, and the detail drawer. Overlays use a translucent black scrim; the detail drawer adds a restrained 6px backdrop blur.

### Shadow Vocabulary

- **Ambient Lift** (`0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)`): Hover feedback for cards and list rows.
- **Overlay Lift** (`0 2px 8px rgba(0, 0, 0, 0.06), 0 12px 32px rgba(0, 0, 0, 0.05)`): Modals, drawers, confirmations, and toasts.
- **Agent Tile Lift** (`0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)`): Small white agent-icon tiles that must remain distinct inside dense rows.

**The Flat Workbench Rule.** Resting work surfaces use border and tone; shadow means hover, floating feedback, or overlay hierarchy.

## Shapes

The core form language uses two gently curved radii: 8px for controls, list rows, icon tiles, and nested containers; 14px for cards, panels, and dialogs. Compact status badges and micro-controls may use 6px, while filter chips use a 20px capsule and status pills use a full 999px radius. Large feature icons may reach 12–16px corners, but remain visually related to the main scale.

Borders are consistently thin and cool gray. Circular geometry is reserved for color swatches and small indicators; most product surfaces remain rounded rectangles so the filesystem-oriented workspace feels precise and stable.

**The Nested Radius Rule.** A nested control uses the 8px small radius inside a 14px parent surface; it must not equal or exceed the parent's visual roundness.

## Components

Components feel refined and restrained: compact, quiet at rest, and explicit when selected or actionable. Most state transitions complete in 150ms; presses may compress to 97% over 100ms, and loading icons rotate linearly without adding decorative motion.

### Buttons

- **Shape:** Gently curved control corners (`{rounded.sm}`) with compact 8px × 16px padding; small buttons use 6px × 12px.
- **Primary:** Synchronization green background with white text and 13px semibold labeling.
- **Hover / Focus:** Primary buttons deepen to the strong green; fields and custom focus states shift their border or outline to the primary accent. Active presses scale to 97%; disabled controls reduce opacity and suppress the press transform.
- **Soft:** A 10% primary tint with strong-green text for secondary actions that still belong to the main workflow.
- **Ghost / Outline / Danger:** Ghost buttons use muted text and a subtle hover fill; outline buttons use the structural border; destructive actions use the error color with white text.
- **Icon Controls:** 30–32px square controls use 6–8px corners and reveal a subtle surface fill on hover.

### Chips

- **Style:** Filter chips are 20px capsules with a white fill, subtle border, muted 12px text, and 6px × 14px padding. Compact category badges use 6px corners and tinted semantic fills.
- **State:** Selected filters become fully synchronization green with white text. Unselected filters gain only stronger border and text contrast on hover.

### Cards / Containers

- **Corner Style:** Main cards and panels use the 14px surface radius; nested detail cards use 8px.
- **Background:** White work surfaces sit on the cold-mist application background.
- **Shadow Strategy:** Flat at rest, Ambient Lift on hover, Overlay Lift only for floating layers.
- **Border:** One-pixel subtle gray by default, strengthening on hover.
- **Internal Padding:** 18–24px for main cards; 12–16px for dense rows and nested containers.

### Inputs / Fields

- **Style:** 34–40px high fields use the pale cool-gray fill, subtle border, 8px corners, and 12px horizontal padding. Paths and file facts use the mono family.
- **Focus:** The border changes to synchronization green; editable path fields also return to a white surface.
- **Error / Disabled:** Errors are stated with error-colored text and supporting state copy. Disabled interactive controls reduce opacity and retain their stable dimensions.

### Navigation

- **Style:** Sidebar and local settings navigation use compact 13–14px medium labels, 16px outline icons, 8px corners, and 9–10px vertical padding.
- **Default / Hover / Active:** Default items are muted, hover adds the subtle surface fill and primary text, and active items use a 10% primary tint with strong-green text and semibold weight.
- **Responsive:** Navigation rails disappear at their established breakpoints rather than compressing into unreadable narrow columns.

### Skill State Matrix

Agent icons appear as small white rounded-square tiles. Installed is full opacity, missing is reduced to 30% opacity, and broken adds an error-tinted surface plus an inset error stroke. Textual state, status badges, and action affordances remain present so opacity and hue are never the only evidence.

### Dialogs and Feedback

Modals use a 14px white surface, 28px padding, Overlay Lift, and a 35% black scrim. Confirmation dialogs tighten to a 360px body and 24px × 28px padding. Toasts invert to the primary text color as their background with white copy, enter over 300ms, and disappear automatically after brief confirmation.

## Do's and Don'ts

### Do:

- **Do** reserve synchronization green for primary actions, active selections, and confirmed workflow state.
- **Do** use thin borders and cool-neutral layer changes as the first method of grouping content.
- **Do** preserve the 8px control radius inside 14px cards and panels.
- **Do** use Avenir Next for hierarchy, the system stack for interface copy, and mono only for literal technical content.
- **Do** keep repeated operational rows compact and ensure status remains understandable through labels or icons as well as color.

### Don't:

- **Don't** apply resting shadows to every card or row; elevation is interaction and overlay feedback.
- **Don't** turn synchronization green into a large decorative background or introduce competing structural accent hues.
- **Don't** use warning, success, error, or custom-skill colors without a semantic state or category.
- **Don't** replace the established cool-white surfaces with gradients or ornamental textures as a default treatment.
- **Don't** stretch routine dashboard copy or controls into oversized marketing typography and spacing.
