# Homepage Terminal Variant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a switchable terminal-style homepage variant with GSAP/ScrollTrigger-enhanced storytelling, generated visual assets, and unchanged homepage SEO/URLs.

**Architecture:** Keep the current homepage variant intact and introduce a separate terminal homepage component selected through a small config module. Reuse the existing homepage data flow, generate project-bound raster assets for the terminal look, and load GSAP only inside the terminal variant so the default homepage remains unaffected.

**Tech Stack:** Astro 5, TypeScript, CSS, GSAP, ScrollTrigger, OpenAI image generation via built-in `image_gen`, existing Astro static build pipeline

---

## File Structure

**Create:**
- `D:\develop\project\mywebsite\src\data\homepage-variant.ts`
- `D:\develop\project\mywebsite\src\components\HomePageTerminal.astro`
- `D:\develop\project\mywebsite\public\images\homepage-terminal\hero-control-room.png`
- `D:\develop\project\mywebsite\public\images\homepage-terminal\signal-grid.png`
- `D:\develop\project\mywebsite\public\images\homepage-terminal\scan-noise.png`
- `D:\develop\project\mywebsite\docs\superpowers\plans\2026-05-02-homepage-terminal-implementation.md`

**Modify:**
- `D:\develop\project\mywebsite\package.json`
- `D:\develop\project\mywebsite\src\pages\index.astro`
- `D:\develop\project\mywebsite\src\pages\zh\index.astro`
- `D:\develop\project\mywebsite\src\components\HomePageRedesign.astro`

**Optional create if component size grows too large:**
- `D:\develop\project\mywebsite\src\components\terminal\TerminalHero.astro`
- `D:\develop\project\mywebsite\src\components\terminal\TerminalSections.astro`

**Verify with:**
- `npm run build`

---

### Task 1: Add Homepage Variant Switch

**Files:**
- Create: `D:\develop\project\mywebsite\src\data\homepage-variant.ts`
- Modify: `D:\develop\project\mywebsite\src\pages\index.astro`
- Modify: `D:\develop\project\mywebsite\src\pages\zh\index.astro`

- [ ] **Step 1: Write the failing test condition**

Use a simple build-level failure target: wire the pages to import a config file that does not exist yet, then run the build.

Planned import shape:

```ts
import { homepageVariant } from '../data/homepage-variant';
```

- [ ] **Step 2: Run build to verify it fails**

Run:

```powershell
npm run build
```

Expected:

```text
Build fails because src/data/homepage-variant.ts does not exist.
```

- [ ] **Step 3: Create the minimal variant config**

File: `D:\develop\project\mywebsite\src\data\homepage-variant.ts`

```ts
export type HomepageVariant = 'default' | 'terminal';

export const homepageVariant: HomepageVariant = 'terminal';
```

- [ ] **Step 4: Update homepage entry pages to branch on the variant**

For `src/pages/index.astro` and `src/pages/zh/index.astro`, keep the existing data loading intact and switch the rendered component:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import HomePageDefault from '../components/HomePageRedesign.astro';
import HomePageTerminal from '../components/HomePageTerminal.astro';
import { homepageVariant } from '../data/homepage-variant';
// keep existing collection loading
---

<BaseLayout ...>
	{homepageVariant === 'terminal' ? (
		<HomePageTerminal ... />
	) : (
		<HomePageDefault ... />
	)}
</BaseLayout>
```

Use the same relative paths in the `zh` page.

- [ ] **Step 5: Run build to verify the config path works**

Run:

```powershell
npm run build
```

Expected:

```text
Build still fails because HomePageTerminal.astro does not exist yet.
```

- [ ] **Step 6: Commit**

```powershell
git add src/data/homepage-variant.ts src/pages/index.astro src/pages/zh/index.astro
git commit -m "feat: add homepage variant switch"
```

---

### Task 2: Add GSAP Dependency

**Files:**
- Modify: `D:\develop\project\mywebsite\package.json`

- [ ] **Step 1: Write the failing test condition**

Plan the terminal homepage script to import GSAP:

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
```

- [ ] **Step 2: Run build to verify it fails without the dependency**

Run:

```powershell
npm run build
```

Expected:

```text
Build fails because the gsap package is not installed.
```

- [ ] **Step 3: Add the dependency**

Update `package.json` dependencies with:

```json
{
  "dependencies": {
    "gsap": "^3.13.0"
  }
}
```

Then install:

```powershell
npm install
```

- [ ] **Step 4: Run build to verify dependency resolution succeeds**

Run:

```powershell
npm run build
```

Expected:

```text
Build still fails because HomePageTerminal.astro has not been created yet, but gsap import resolution is no longer the blocker.
```

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json
git commit -m "build: add gsap for terminal homepage"
```

---

### Task 3: Generate Terminal Visual Assets

**Files:**
- Create: `D:\develop\project\mywebsite\public\images\homepage-terminal\hero-control-room.png`
- Create: `D:\develop\project\mywebsite\public\images\homepage-terminal\signal-grid.png`
- Create: `D:\develop\project\mywebsite\public\images\homepage-terminal\scan-noise.png`

- [ ] **Step 1: Generate the hero image with built-in image generation**

Prompt:

```text
Use case: stylized-concept
Asset type: homepage hero background
Primary request: a cinematic hacker terminal control room atmosphere for a personal knowledge website homepage
Scene/backdrop: dark digital control console environment with layered monitors, abstract signal traces, subtle grid lighting, no people
Subject: immersive terminal control center background
Style/medium: high-detail digital illustration with realistic lighting and sharp interface glow
Composition/framing: wide landscape composition for a website hero, clear center-left negative space for title and buttons
Lighting/mood: cool cyan and cold white glow, restrained contrast, dramatic but readable
Color palette: charcoal, graphite, muted black, cyan, steel blue
Constraints: no text, no watermark, no logos, no characters, no purple neon overload
Avoid: crowded cyberpunk street scene, anime, heavy orange lighting, visible brand marks
```

- [ ] **Step 2: Save the generated hero image into the project**

Move the selected output from the built-in generated image location into:

```text
D:\develop\project\mywebsite\public\images\homepage-terminal\hero-control-room.png
```

- [ ] **Step 3: Generate the signal grid texture**

Prompt:

```text
Use case: stylized-concept
Asset type: homepage decorative texture
Primary request: a clean futuristic signal grid texture for a terminal-style website background
Scene/backdrop: flat abstract dark grid with faint signal paths and subtle panel seams
Subject: reusable control-console grid texture
Style/medium: crisp digital texture
Composition/framing: seamless-feeling square composition
Lighting/mood: low-key, cool, precise
Constraints: no text, no watermark, no icons, no obvious perspective
Avoid: noisy poster art, strong vignette, giant glowing symbols
```

- [ ] **Step 4: Save the generated signal grid texture**

Move the selected output to:

```text
D:\develop\project\mywebsite\public\images\homepage-terminal\signal-grid.png
```

- [ ] **Step 5: Generate the scan/noise overlay**

Prompt:

```text
Use case: stylized-concept
Asset type: homepage overlay texture
Primary request: subtle scanline and digital noise overlay for a hacker terminal website
Scene/backdrop: abstract monochrome texture only
Subject: reusable scan/noise overlay
Style/medium: minimal digital texture
Composition/framing: seamless-feeling square composition
Lighting/mood: understated and technical
Constraints: no text, no watermark, no symbols, low contrast
Avoid: film dust, paper grain, warm tones
```

- [ ] **Step 6: Save the scan/noise overlay**

Move the selected output to:

```text
D:\develop\project\mywebsite\public\images\homepage-terminal\scan-noise.png
```

- [ ] **Step 7: Verify image sizes and paths**

Run:

```powershell
Get-Item public/images/homepage-terminal/*.png | Select-Object Name,Length
```

Expected:

```text
Three PNG files exist at the expected paths and are small enough for homepage use.
```

- [ ] **Step 8: Commit**

```powershell
git add public/images/homepage-terminal/hero-control-room.png public/images/homepage-terminal/signal-grid.png public/images/homepage-terminal/scan-noise.png
git commit -m "feat: add terminal homepage image assets"
```

---

### Task 4: Build the Terminal Homepage Markup

**Files:**
- Create: `D:\develop\project\mywebsite\src\components\HomePageTerminal.astro`

- [ ] **Step 1: Write the failing component contract**

Match the current homepage prop contract so the entry pages can pass existing data without changes:

```ts
type Labels = /* copy from current homepage component */;
```

Expected initial failure if the prop shape is wrong:

```text
Astro/TypeScript compile errors for missing or mismatched props.
```

- [ ] **Step 2: Create the minimal terminal component shell**

Start with:

```astro
---
import type { CollectionEntry } from 'astro:content';

type StatItem = { label: string; value: string; hint: string };
type DocCard = { section: string; description: string; count: number };
type Action = { href: string; label: string; style?: 'primary' | 'ghost' };
type Labels = {
	heroKicker: string;
	heroTitle: string;
	heroLead: string;
	heroNote: string;
	primaryAction: Action;
	secondaryAction: Action;
	stats: StatItem[];
	spotlightLabel: string;
	spotlightTitle: string;
	spotlightBody: string;
	spotlightLink: string;
	latestSection: string;
	latestMore: string;
	latestFeatured: string;
	latestContinue: string;
	latestRead: string;
	latestFallback: string;
	latestArticleType: string;
	latestTagFallback: string;
	docsSection: string;
	docsMore: string;
	docsSummaryTitle: string;
	docsSummaryBody: string;
	docsSummaryLink: string;
	docsCountSuffix: string;
	docsArrow: string;
	projectsSection: string;
	projectsMore: string;
	projectsFeatured: string;
	projectsOpen: string;
	projectsDemo: string;
	projectsFallback: string;
	toolsSection: string;
	toolsMore: string;
	toolsSummaryTitle: string;
	toolsSummaryBody: string;
	toolsSummaryLink: string;
	toolsFallback: string;
};

const { lang, labels, latestPost, secondaryPosts, docsCards, featuredProjects, featuredTools } = Astro.props as {
	lang: 'zh' | 'en';
	labels: Labels;
	latestPost?: CollectionEntry<'blog'>;
	secondaryPosts: CollectionEntry<'blog'>[];
	docsCards: DocCard[];
	featuredProjects: CollectionEntry<'projects'>[];
	featuredTools: CollectionEntry<'tools'>[];
};
---
```

- [ ] **Step 3: Add the semantic homepage section structure**

Include these top-level sections:

```astro
<div class="terminal-home">
	<section class="terminal-hero">...</section>
	<section class="terminal-signal-strip">...</section>
	<section class="terminal-feed">...</section>
	<section class="terminal-docs">...</section>
	<section class="terminal-projects">...</section>
	<section class="terminal-tools">...</section>
</div>
```

Each section must render real HTML copy and links immediately, without waiting for JS.

- [ ] **Step 4: Reuse existing homepage data in the terminal layout**

Requirements:

- hero uses `labels.heroTitle`, `labels.heroLead`, primary and secondary actions
- signal strip uses `labels.stats`
- latest feed uses `latestPost` and `secondaryPosts`
- docs uses `docsCards`
- projects uses `featuredProjects`
- tools uses `featuredTools`

- [ ] **Step 5: Run build to verify the component compiles**

Run:

```powershell
npm run build
```

Expected:

```text
Build passes or fails only on missing styles/script details, not on missing component props.
```

- [ ] **Step 6: Commit**

```powershell
git add src/components/HomePageTerminal.astro src/pages/index.astro src/pages/zh/index.astro
git commit -m "feat: add terminal homepage structure"
```

---

### Task 5: Style the Terminal Homepage

**Files:**
- Modify: `D:\develop\project\mywebsite\src\components\HomePageTerminal.astro`

- [ ] **Step 1: Write the failing visual target**

Open the local dev build and note the expected failure:

```text
The page renders as unstyled semantic HTML and does not yet feel like a terminal control console.
```

- [ ] **Step 2: Add terminal theme variables and layered backgrounds**

Add CSS that defines:

```css
:root {
	--terminal-bg: #071015;
	--terminal-panel: rgba(7, 16, 21, 0.82);
	--terminal-panel-strong: rgba(10, 24, 31, 0.92);
	--terminal-line: rgba(110, 231, 255, 0.2);
	--terminal-accent: #7df9ff;
	--terminal-accent-soft: rgba(125, 249, 255, 0.14);
	--terminal-text: #e8fcff;
	--terminal-muted: #8caab1;
}
```

Use the generated images as layered backgrounds in the hero and page wrapper.

- [ ] **Step 3: Style each section with terminal-specific treatment**

Required visual outcomes:

- hero reads like terminal boot layer
- signal strip feels like system telemetry
- docs cards look like knowledge modules
- projects feel like deployment panels
- tools feel like command chips or matrix blocks

Keep content readable and avoid burying links under effects.

- [ ] **Step 4: Add responsive rules**

Required breakpoints:

- mobile stack-first layout below 768px
- more layered desktop composition above 768px
- avoid overflow caused by decorative pseudo-elements

- [ ] **Step 5: Run build and visually verify**

Run:

```powershell
npm run build
```

Expected:

```text
Build passes and the homepage renders with the terminal visual language without JavaScript dependency for core content.
```

- [ ] **Step 6: Commit**

```powershell
git add src/components/HomePageTerminal.astro
git commit -m "feat: style terminal homepage variant"
```

---

### Task 6: Add GSAP and ScrollTrigger Enhancements

**Files:**
- Modify: `D:\develop\project\mywebsite\src\components\HomePageTerminal.astro`

- [ ] **Step 1: Write the failing interaction target**

Expected failure before enhancement:

```text
The terminal homepage is static and lacks the planned staged reveal, section activation, and motion hierarchy.
```

- [ ] **Step 2: Add a homepage-only script block**

Use this import pattern inside the terminal component script:

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
```

- [ ] **Step 3: Guard for reduced motion**

Add logic equivalent to:

```ts
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion) return;
```

- [ ] **Step 4: Add scoped animations**

Required enhancements:

- hero title and meta panels staged reveal
- signal strip staggered activation
- docs cards staggered reveal
- projects layered reveal with optional short pin
- tools row drift or activation without blocking interaction

Do not animate opacity from `0` for critical text before hydration. Prefer short transforms and subtle opacity shifts after initial render.

- [ ] **Step 5: Add cleanup for Astro navigation**

Use cleanup that kills triggers and timelines when the page swaps:

```ts
ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
```

Bind cleanup to Astro page lifecycle so repeated navigation does not duplicate animations.

- [ ] **Step 6: Run build to verify script bundling**

Run:

```powershell
npm run build
```

Expected:

```text
Build passes and GSAP is bundled only for the terminal homepage component path.
```

- [ ] **Step 7: Commit**

```powershell
git add src/components/HomePageTerminal.astro package.json package-lock.json
git commit -m "feat: add terminal homepage scroll animations"
```

---

### Task 7: Preserve Default Homepage and Verify Switching

**Files:**
- Modify: `D:\develop\project\mywebsite\src\data\homepage-variant.ts`
- Modify: `D:\develop\project\mywebsite\src\components\HomePageRedesign.astro`

- [ ] **Step 1: Verify default homepage still builds untouched**

Temporarily set:

```ts
export const homepageVariant: HomepageVariant = 'default';
```

- [ ] **Step 2: Run build for default mode**

Run:

```powershell
npm run build
```

Expected:

```text
Build passes and the existing homepage remains unchanged.
```

- [ ] **Step 3: Restore terminal mode and verify again**

Set:

```ts
export const homepageVariant: HomepageVariant = 'terminal';
```

Run:

```powershell
npm run build
```

Expected:

```text
Build passes for the terminal homepage as well.
```

- [ ] **Step 4: Commit**

```powershell
git add src/data/homepage-variant.ts
git commit -m "test: verify homepage variant switching"
```

---

### Task 8: Final Verification

**Files:**
- Verify only

- [ ] **Step 1: Run full build**

```powershell
npm run build
```

Expected:

```text
Astro build completes successfully and generated homepage routes still include / and /zh/.
```

- [ ] **Step 2: Verify JS-off fallback**

Manual check:

- open the built homepage locally
- disable JavaScript in the browser
- confirm hero copy, links, latest content, docs, projects, and tools remain visible

- [ ] **Step 3: Verify reduced motion**

Manual check:

- enable `prefers-reduced-motion`
- confirm the homepage does not run the full animation sequence

- [ ] **Step 4: Verify mobile layout**

Manual check:

- inspect at 390px width
- confirm no clipped buttons, no horizontal scrolling, and no unreadable overlays

- [ ] **Step 5: Verify asset payload sanity**

Run:

```powershell
Get-Item public/images/homepage-terminal/*.png | Select-Object Name,Length
```

Expected:

```text
Hero and texture files are present and reasonably sized for homepage delivery.
```

- [ ] **Step 6: Final commit if verification fixes were needed**

```powershell
git add .
git commit -m "chore: polish terminal homepage rollout"
```

---

## Self-Review

- Spec coverage checked: variant switch, terminal component, GSAP usage, generated images, SEO safety, performance constraints, accessibility, and verification all map to explicit tasks.
- Placeholder scan checked: no `TBD`, `TODO`, or "implement later" markers remain.
- Type consistency checked: `homepageVariant` uses the same `'default' | 'terminal'` values across planning tasks, and the terminal component is designed to accept the same props as the current homepage implementation.
