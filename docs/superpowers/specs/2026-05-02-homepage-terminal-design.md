# Homepage Terminal Design

Date: 2026-05-02
Status: Draft approved in conversation, pending written spec review

## Goal

Create an alternate homepage experience for the personal website that feels like a hacker terminal / digital control console while preserving the existing homepage as a switchable fallback.

The new homepage should:

- feel more cinematic and technology-forward
- use images, CSS effects, and lightweight animation instead of heavy video
- support future switching between the current homepage and the new terminal homepage
- preserve homepage SEO, information architecture, and readability

## Scope

This change only targets the homepage presentation layer and homepage interaction layer.

In scope:

- homepage visual redesign
- homepage section layout changes
- GSAP and ScrollTrigger-based animations for the alternate homepage
- homepage-only background art, image assets, and decorative effects
- a configuration-based homepage variant switch

Out of scope:

- blog article pages
- docs pages
- projects pages
- tools pages
- URL changes
- content model changes for blog/docs/projects/tools collections

## Product Direction

The selected direction is a mixed-intensity terminal homepage:

- the hero and section transitions should feel dramatic
- the content sections should remain readable and useful
- the page should resemble a personal knowledge control console rather than a generic landing page

The visual tone should lean toward:

- hacker terminal
- digital control center
- signal/status dashboard
- cool monochrome or cold-color lighting instead of neon chaos

## Homepage Strategy

The site should support two homepage variants:

- `default`: the current homepage experience
- `terminal`: the new control-console experience

The variant should be chosen by a simple configuration value so the homepage can be switched later without refactoring content or changing routes.

Recommended implementation shape:

- keep the existing homepage component intact
- add a new `HomePageTerminal.astro` component
- use a small config module or top-level homepage constant to select the active homepage variant

## Information Architecture

The homepage should keep the existing logical content order so SEO and usability stay stable:

1. Hero
2. Primary actions
3. Key site stats
4. Latest content
5. Documentation
6. Projects
7. Tools

The terminal variant may present these sections with different wrappers, labels, animation timing, and layout treatment, but the underlying content meaning should remain the same.

## Section Design

### Hero: Terminal Boot Layer

Purpose:

- introduce the personal brand
- establish the terminal aesthetic
- preserve the homepage H1 and core intro copy

Design:

- layered background with grid, glow, scanline, and atmospheric image treatment
- terminal boot/status panel beside or beneath the hero copy
- primary and secondary actions remain obvious and clickable without waiting for animation

Animation:

- staged title reveal
- subtle scan sweep or line pulse
- small stat indicators or signal flicker

### Signal Strip: System Status

Purpose:

- present counts for docs, projects, tools, or other useful metrics
- make the page feel active and data-driven

Design:

- compact status row styled like system telemetry
- should stay lightweight and readable on mobile

Animation:

- count reveal
- subtle staggered panel activation

### Latest Content: Transmission Feed

Purpose:

- keep recent writing visible
- make the homepage still useful for repeat readers

Design:

- featured item plus supporting items, or a compact feed panel
- labels can shift from editorial language toward terminal language

Animation:

- cards reveal as a synchronized feed activation

### Docs: Knowledge Index

Purpose:

- preserve docs as a primary homepage path

Design:

- module cards styled like unlocked knowledge nodes
- strong hierarchy and direct click targets

Animation:

- staggered activation
- optional border pulse or faint trace line motion

### Projects: Deployment Board

Purpose:

- position projects as live systems or deployed modules

Design:

- cards or panels with stronger visual presence than the tools section
- room for iconography, status tags, or live/demo indicators

Animation:

- layered reveal
- optional short pin window or depth motion, but no aggressive scroll hijacking

### Tools: Command Matrix

Purpose:

- keep tools visible without overpowering docs and projects

Design:

- chip grid, matrix list, or command-bus strip
- should feel fast and dense

Animation:

- controlled marquee/data-flow feel
- must remain usable and pause gracefully on hover/focus when needed

## Animation Principles

GSAP and ScrollTrigger may be used only on the terminal homepage variant.

Rules:

- no full-page scroll hijacking
- no hiding critical copy until JS executes
- no reliance on animation for basic navigation
- support `prefers-reduced-motion`
- keep mobile motion simpler than desktop motion

Recommended animation types:

- section reveal
- stagger
- light parallax
- short pin sections
- horizontal drift for selected decorative elements

Avoid:

- long autoplay animation sequences before content is usable
- excessive blur/filter chains
- large numbers of simultaneous animated elements
- effects that reduce text contrast or readability

## SEO and Performance Constraints

The redesign should not materially harm homepage SEO.

Requirements:

- homepage URLs stay unchanged
- title, description, and main heading remain meaningful
- primary content and links render in server output
- images are optimized and sized intentionally
- no homepage video dependency
- JS should enhance content, not gate content

Performance targets:

- keep the hero media lightweight
- lazy-load non-critical decorative assets
- load GSAP only for the terminal homepage
- avoid large layout shifts caused by animation setup

## Accessibility Constraints

- maintain readable contrast
- keep keyboard access intact
- ensure buttons and links remain visible before animation
- reduce or disable motion when `prefers-reduced-motion` is enabled
- avoid flashing or rapid strobe-like effects

## Technical Approach

Recommended implementation path:

1. add a homepage variant selector
2. create the terminal homepage component
3. reuse existing homepage data inputs
4. add homepage-specific styles and assets
5. add homepage-only GSAP/ScrollTrigger enhancement
6. verify fallback rendering without JS

## Testing Strategy

Before rollout:

- verify both homepage variants render correctly
- verify mobile and desktop layouts
- verify homepage remains understandable with JS disabled
- verify reduced-motion behavior
- verify build output and static generation
- compare performance before and after for homepage weight and responsiveness

## Open Decision Resolved

Resolved choices from discussion:

- style direction: hacker terminal / digital control console
- intensity: mixed-intensity, not fully maximalist
- media: images and CSS effects instead of video-first hero
- switching: yes, homepage should support later switching between variants

## Implementation Boundary

This design intentionally changes only the homepage experience.

If the terminal variant succeeds, similar visual language can later be selectively extended to other surfaces, but that is not part of this task.
