---
name: Lumina Intelligence
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c7c4d6'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#918f9f'
  outline-variant: '#464554'
  surface-tint: '#c2c1ff'
  primary: '#c2c1ff'
  on-primary: '#1c0b9f'
  primary-container: '#5856d6'
  on-primary-container: '#e7e4ff'
  inverse-primary: '#4f4ccd'
  secondary: '#aac7ff'
  on-secondary: '#003064'
  secondary-container: '#3e90ff'
  on-secondary-container: '#002957'
  tertiary: '#e9b3ff'
  on-tertiary: '#510074'
  tertiary-container: '#9a33cd'
  on-tertiary-container: '#f9dfff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c2c1ff'
  on-primary-fixed: '#0c006a'
  on-primary-fixed-variant: '#3631b4'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#aac7ff'
  on-secondary-fixed: '#001b3e'
  on-secondary-fixed-variant: '#00468d'
  tertiary-fixed: '#f6d9ff'
  tertiary-fixed-dim: '#e9b3ff'
  on-tertiary-fixed: '#310048'
  on-tertiary-fixed-variant: '#7200a3'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1440px
  sidebar-width: 360px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
---

## Brand & Style

This design system is built for the next generation of personalized education, specifically targeting technical and high-concentration learning environments. The aesthetic is "Midnight Academic"—a blend of high-end developer tools and immersive cinematic platforms. It leverages a **Corporate Modern** foundation mixed with **Minimalism** to ensure that the interface recedes, allowing the educational content and data visualizations to remain the focal point.

The emotional goal is to evoke a sense of focus, intelligence, and cutting-edge capability. By utilizing a deep, dark canvas, we reduce eye strain during long study sessions and allow vibrant accent colors to act as cognitive anchors for important information.

## Colors

The palette is anchored in a true-black background to maximize contrast and depth. 
- **Primary & Tertiary:** Electric Purples and Blues are reserved for "Intelligence" elements—AI responses, data nodes, and active progress states.
- **Surface Strategy:** We use a tiered charcoal system. Level 0 is pure black (#050505). Level 1 surfaces (cards, sidebars) use a deep charcoal (#121212) to create a subtle sense of physical layering.
- **Accents:** High-vibrancy gradients are used sparingly in data visualizations to represent complexity without overwhelming the user.

## Typography

The system utilizes **Hanken Grotesk** for its exceptional legibility and modern, slightly technical feel. It strikes a balance between being approachable and authoritative. For technical metadata, sidebar labels, and developer-centric interactions, we use **Geist**—a monospaced-adjacent sans-serif that emphasizes precision.

**Hierarchy Rules:**
- Headlines use tighter letter spacing and heavier weights to feel "locked-in."
- Body text maintains a generous line height to prevent fatigue during long reads.
- Label styles are often set in uppercase to differentiate navigation from content.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The main content area (video or 3D visualization) is fluid and expansive, while the interaction sidebar is fixed at 360px to maintain consistent readability for chat and flashcards.

**Breakpoints:**
- **Desktop (1280px+):** 2-column layout. Sidebar persists on the right.
- **Tablet (768px - 1279px):** Sidebar collapses into an overlay or shifts below the primary content.
- **Mobile (<767px):** Single column stack. Tabs are used to toggle between the video feed and the interaction tools (Chat/Tutor).

Spacing follows an 8px base grid, ensuring all components align to a predictable vertical rhythm.

## Elevation & Depth

This design system avoids traditional heavy dropshadows in favor of **Tonal Layers** and **Subtle Outlines**.

1.  **Level 0 (Canvas):** Pure black, the infinite void behind everything.
2.  **Level 1 (Panels):** Deep charcoal with a 1px solid border (#2C2C2E). This defines the structural layout.
3.  **Level 2 (Popovers/Modals):** Slight elevation achieved via a very soft, large-radius glow (Indigo-tinted) rather than a black shadow, making the element appear as if it's emitting light.
4.  **Glassmorphism:** Used exclusively for video overlays (e.g., player controls) to maintain context of the underlying media.

## Shapes

The shape language is "Calculated Softness." Elements use a consistent 0.5rem (8px) corner radius to feel modern but structured. 

- **Cards & Sidebars:** 8px radius.
- **Input Fields & Buttons:** 8px radius for a unified "tool-like" appearance.
- **Visual Markers:** Small chips or status indicators use a fully rounded (pill) shape to distinguish them from interactive buttons.

## Components

### Buttons
Primary buttons use a solid Blue-to-Purple gradient or a high-contrast white-on-charcoal. Interaction states (hover) should trigger a subtle inner glow rather than a color shift.

### The Sidebar (Interaction Hub)
The sidebar uses a secondary navigation tab system at the top (Tutor, Chat, Flashcards, Timestamps). The active tab is indicated by a 2px bottom border in the primary accent color.

### Chat & Message Bubbles
Messages do not use "bubbles" in the traditional sense. Instead, they are separated by subtle horizontal dividers or slight background variations, mimicking a terminal or code editor for a more "expert" feel.

### Flashcards
Cards feature a high-contrast "Surface Level 2" background. When flipped, the transition should be a crisp 3D transform, maintaining the spatial logic of the interface.

### Input Fields
Inputs are dark-themed with a subtle 1px border. On focus, the border transitions to the primary blue accent with a very faint outer glow to simulate "activation."
