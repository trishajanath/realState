# Xverta Enterprise Design System v2 - UI Implementation Skill

## Objective

Implement a premium enterprise SaaS interface using a strict monochrome design language.

The final result must feel comparable to Linear, Raycast, Vercel Dashboard, Stripe Dashboard, and modern enterprise control panels.

This is NOT a marketing website.

This is NOT a startup landing page.

This is NOT a glassmorphism showcase.

This is NOT a colorful dashboard.

The entire application must prioritize:

- Information density
- Readability
- Hierarchy
- Fast scanning
- Professional appearance
- Minimal visual noise
- Consistent spacing
- Strong typography

---

# Technology Requirements

Mandatory stack:

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Bits components only when explicitly required
- Lucide icons

Do NOT introduce:

- Material UI
- Chakra UI
- Ant Design
- Bootstrap
- DaisyUI

---

# Visual Language

## Color System

Strict monochrome palette.

### Background

Primary Background:
#000000

Secondary Surface:
#0A0A0A

Tertiary Surface:
#111111

Hover Surface:
#161616

Active Surface:
#1C1C1C

### Text

Primary Text:
#FFFFFF

Secondary Text:
#A1A1AA

Muted Text:
#71717A

Disabled Text:
#52525B

### Borders

Primary Border:
#1F1F1F

Secondary Border:
#2A2A2A

### Status Colors

Only use when necessary.

Success:
#FFFFFF

Warning:
#D4D4D4

Error:
#A1A1AA

Never use:

- Bright green
- Bright red
- Bright blue
- Neon colors
- Rainbow indicators

---

# Typography System

## Font

Preferred:

- Inter

Fallback:

- System UI
- Segoe UI
- Arial

---

## Font Sizes

Page Title:
36px
Weight 700

Section Title:
24px
Weight 600

Subsection:
20px
Weight 600

Card Title:
16px
Weight 600

Body:
14px
Weight 400

Small:
13px
Weight 400

Caption:
12px
Weight 400

Micro:
11px
Weight 400

---

# Layout System

## Maximum Width

Content Container:
1600px

Center aligned.

---

## Page Padding

Desktop:
32px

Tablet:
24px

Mobile:
16px

---

# Spacing Scale

Use only:

4px
8px
12px
16px
20px
24px
32px
40px
48px
64px

Avoid random values.

---

# Vertical Rhythm

Between page title and content:
32px

Between sections:
40px

Between subsection groups:
24px

Between form elements:
16px

Between related controls:
8px

---

# Border Radius

Small:
8px

Medium:
12px

Large:
16px

Never exceed:
16px

No pill-shaped containers.

---

# Shadows

Minimal.

Allowed:

shadow-sm

Avoid:

- Heavy shadows
- Floating cards
- Glow effects
- Neon effects

---

# Animation Rules

## Critical

Do NOT add decorative animations.

Forbidden:

- Floating particles
- Background movement
- AI-themed effects
- Glowing borders
- Pulse effects
- Breathing effects
- Sparkles
- Animated gradients
- Morphing shapes

---

## Allowed Animations

Hover:

150ms

Dropdown:

200ms

Modal:

200ms

Accordion:

200ms

Everything else:

Instant

---

# Surface Design

Avoid card-heavy layouts.

Prefer:

- Transparent sections
- Divider-based organization
- Inline content grouping
- Structured spacing

Bad:

[ Card ]
[ Card ]
[ Card ]
[ Card ]

Good:

Section Header
----------------

Content

----------------

Content

---

# Navigation

## Sidebar

Width:
280px

Background:
#000000

Border Right:
1px solid #1F1F1F

Structure:

Logo

Main Navigation

Secondary Navigation

Settings

User Profile

---

## Sidebar Item

Height:
40px

Padding:
12px

Hover:
#111111

Active:
#161616

Radius:
8px

---

# Header

Height:
64px

Sticky

Border Bottom:
1px solid #1F1F1F

Contains:

- Page Title
- Search
- Notifications
- User Menu

---

# Dashboard Structure

Order:

1. Header
2. Summary Metrics
3. Activity Feed
4. Operational Content
5. Tables
6. Insights

---

# Metrics Design

Do NOT use giant cards.

Preferred:

Revenue
$48,230

Users
1,482

Growth
12.4%

Displayed inline.

Grid:

4 columns desktop

2 tablet

1 mobile

---

# Tables

Tables are primary information surfaces.

Requirements:

- Compact rows
- 48px row height
- Sticky header
- Hover state
- Search
- Sorting
- Pagination

Avoid oversized spacing.

---

# Forms

Input Height:
40px

Textarea Minimum:
120px

Spacing:
16px

Label Margin:
8px

---

# Buttons

Primary

Background:
#FFFFFF

Text:
#000000

Height:
40px

Radius:
8px

---

Secondary

Background:
transparent

Border:
1px solid #2A2A2A

Text:
#FFFFFF

---

Ghost

No border

Transparent

Hover:
#111111

---

# Modals

Width:
600px

Padding:
24px

Background:
#0A0A0A

Border:
1px solid #1F1F1F

---

# Activity Feed

Use timeline design.

Structure:

Timestamp

Event Title

Description

Actor

Avoid cards.

Use separators.

---

# Empty States

Centered.

Contains:

Title

Description

Action Button

No illustrations.

No emojis.

No cartoons.

---

# Loading States

Use skeleton loaders.

Do NOT use:

- Spinners everywhere
- Fancy AI animations
- Pulsing gradients

---

# Search Experience

Always visible.

Desktop:

Header search.

Mobile:

Expandable.

---

# Data Visualization

Charts:

- Line
- Bar
- Area

Theme:

Black background

White labels

Muted grid lines

No bright colors.

No gradients.

No glow.

---

# Mobile Responsiveness

Required.

Breakpoints:

sm: 640px

md: 768px

lg: 1024px

xl: 1280px

2xl: 1536px

All layouts must gracefully collapse.

No horizontal scrolling.

---

# Accessibility

Minimum contrast:
WCAG AA

Keyboard navigation:
Required

Focus states:
Required

Screen reader support:
Required

---

# Implementation Rules

Always use:

- shadcn/ui components
- Tailwind utility classes
- Consistent spacing scale
- Monochrome palette
- Divider-based hierarchy

Never use:

- Random colors
- AI-themed visual effects
- Gradient backgrounds
- Glassmorphism
- Heavy shadows
- Floating cards
- Excessive animations
- Emoji icons
- Decorative illustrations

Every screen must feel like a premium enterprise operating system rather than a marketing website.

The design should prioritize clarity, hierarchy, density, and professional software aesthetics above visual decoration.