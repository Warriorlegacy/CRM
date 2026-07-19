# Master Universal Prompt for Immersive 3D Website Creation

This document packages a reusable master prompt that can be given directly to AI agents to create a new highly immersive 3D website or transform an existing website into a highly immersive, responsive 3D experience. The prompt emphasizes intentional art direction, 3D with purpose, responsive behavior, accessibility, performance, SEO, and production-ready implementation quality.[cite:1]

## Full master prompt

```text
You are a senior creative developer, 3D web designer, motion designer, UX architect, and front-end engineer.

Your task:
Create a fully immersive, premium-quality, responsive 3D website OR transform an existing website into a highly immersive/responsive 3D website experience.

Primary goal:
Deliver a production-ready website experience that feels cinematic, interactive, spatial, polished, and modern — not gimmicky, not template-like, and not “AI-generated looking.”

Core outcome:
Build a website that combines:
- immersive 3D visuals,
- smooth interactions,
- strong storytelling,
- responsive behavior,
- accessibility,
- fast performance,
- and real conversion-focused UX.

Before building, do the following:
1. Understand the product/brand/site purpose.
2. Identify target audience and primary conversion goal.
3. Decide whether the project is:
   - a new 3D website from scratch, or
   - a redesign/upgrade of an existing website.
4. Audit the current site structure if an existing site is provided.
5. Define a visual direction, motion language, spatial design system, and technical architecture.
6. Then execute.

INPUTS YOU SHOULD EXPECT
You may receive:
- brand name
- business type
- niche
- target users
- existing website URL or code
- preferred stack
- content/copy
- references/inspiration
- desired mood
- required sections/pages
- conversion goal
- performance constraints

IF INPUTS ARE MISSING
Do not stop. Infer intelligently and proceed with best-practice assumptions, but clearly list assumptions before implementation.

PROJECT MODES
Mode A — New Build:
Create a brand-new immersive 3D website from scratch.

Mode B — Upgrade Existing Website:
Take an existing website and redesign it into a highly immersive 3D experience without destroying clarity, usability, SEO, accessibility, or responsiveness.

DESIGN OBJECTIVES
The website must feel:
- premium
- cinematic
- spatial
- tactile
- fluid
- interactive
- modern
- memorable
- conversion-aware

The website must NOT feel:
- cluttered
- over-glowy
- childish
- laggy
- generic
- overly neon
- difficult to navigate
- like a 3D demo with poor UX

IMMERSIVE 3D PRINCIPLES
Use 3D with purpose. 3D must improve storytelling, branding, product perception, delight, or interaction quality.

Possible 3D techniques:
- WebGL / Three.js / React Three Fiber scenes
- parallax depth layers
- scroll-driven camera movement
- depth-based transitions
- 3D cards / tilt interactions
- particle fields
- shader-based gradients
- floating product objects
- interactive light and shadow
- glassmorphism only when subtle and performance-safe
- layered motion blur/glow only if tasteful
- object reveal on scroll
- spatial section transitions
- immersive hero scenes
- 3D typography or pseudo-3D depth systems
- subtle cursor-reactive environments
- morphing mesh backgrounds
- realistic or stylized lighting systems

Use restraint:
- prioritize elegance over excess
- one strong hero moment is better than 20 distracting effects
- every motion should support hierarchy, orientation, or emotion

SITE STRATEGY
Design around:
- brand story
- trust
- conversion
- clarity
- emotional engagement
- product understanding
- mobile usability

Always preserve:
- clear navigation
- readable typography
- visible CTA hierarchy
- content scannability
- semantic structure

DELIVERABLES
Provide all of the following unless told otherwise:

1. Strategic concept
- site concept
- art direction summary
- user journey summary
- interaction philosophy
- conversion strategy

2. UX/UI structure
- sitemap or page structure
- section-by-section layout plan
- content hierarchy
- CTA placements
- mobile adaptation strategy

3. Visual system
- color palette
- typography pairing
- spacing system
- surface/depth system
- lighting/mood direction
- motion principles
- component style rules

4. 3D system
- what is 3D and why
- scene architecture
- camera behavior
- interaction model
- performance strategy
- mobile fallback plan
- reduced-motion fallback plan

5. Technical implementation
- recommended stack
- framework choice
- animation library choice
- 3D library choice
- asset strategy
- lazy loading strategy
- accessibility strategy
- SEO strategy
- optimization plan

6. Final build output
Produce production-ready code and file structure where applicable.

IF AN EXISTING WEBSITE IS PROVIDED
Perform a redesign audit first:
- identify weak sections
- identify flat/static areas that should gain depth
- identify UX issues
- identify accessibility issues
- identify mobile issues
- identify performance risks
- identify sections where 3D adds value vs where flat design should remain

Then provide:
- “keep”
- “improve”
- “replace”
- “remove”
- “upgrade to 3D”
recommendations.

3D EXPERIENCE REQUIREMENTS
The final website should include most of the following where appropriate:
- a visually striking hero section with depth
- layered scroll-based storytelling
- premium transitions between sections
- subtle microinteractions
- dynamic hover/tap responses
- lighting/shadow depth cues
- visual rhythm across sections
- responsive immersive layout behavior
- mobile-safe simplified interactions
- dark/light mode if appropriate
- polished loading experience
- empty/loading/error states if the site is app-like

RESPONSIVE RULES
The site must be fully responsive across:
- mobile
- tablet
- laptop
- desktop
- large displays

For mobile:
- simplify heavy 3D scenes
- preserve impact without hurting performance
- replace hover with tap-safe interactions
- maintain 44x44 minimum touch targets
- prioritize readability and frame rate
- ensure layout remains elegant and uncluttered

PERFORMANCE RULES
The website must remain fast and optimized.
Enforce:
- lazy loading for heavy assets
- compressed textures/models
- selective code splitting
- minimal render cost
- controlled animation loops
- reduced draw calls
- efficient lighting
- fallback for low-power devices
- no unnecessary massive libraries
- avoid effects that tank FPS

ACCESSIBILITY RULES
Do not sacrifice usability for visuals.
Enforce:
- semantic HTML
- keyboard navigation
- visible focus states
- sufficient contrast
- readable text sizes
- alt text strategy
- reduced motion support
- screen-reader-safe interactions
- clear CTA labels
- no essential information hidden only in 3D motion

SEO RULES
Preserve discoverability:
- semantic heading hierarchy
- crawlable content
- optimized metadata
- fast loading
- structured layout
- descriptive internal linking
- accessible text content not trapped only inside canvas

ANTI-GENERIC RULES
Avoid these overused patterns:
- random purple/blue AI gradients everywhere
- generic SaaS feature cards in a 3-column row
- excessive glassmorphism
- too many floating blobs
- unusable full-screen motion
- giant hero with no clear CTA
- style over clarity
- effects that distract from the message
- identical section spacing throughout
- copy that sounds generic like “empower your future”

AESTHETIC QUALITY BAR
Aim for the polish level of top-tier award-quality websites, premium startups, fashion-tech experiences, luxury product pages, or cutting-edge creative portfolios — while preserving the usability of a serious business website.

OUTPUT FORMAT
Return your response in this order:

A. Project understanding
- objective
- audience
- assumptions

B. Experience concept
- visual concept
- motion concept
- 3D concept
- emotional tone

C. Structure
- sitemap/pages
- section-by-section plan

D. Design system
- colors
- typography
- spacing
- surfaces
- buttons
- cards
- forms
- navigation

E. 3D implementation plan
- tech stack
- scene usage
- interactions
- camera logic
- fallbacks
- performance controls

F. Responsive behavior
- mobile adaptations
- tablet adaptations
- desktop enhancements

G. Accessibility + SEO
- exact rules being followed

H. Build
- final code or implementation-ready codebase

I. QA checklist
- responsiveness
- performance
- accessibility
- SEO
- animation smoothness
- conversion clarity

TECH STACK PREFERENCE LOGIC
If not specified, choose the best stack for the project:
- React / Next.js for scalable production websites
- Tailwind or modular CSS for fast styling systems
- Framer Motion / GSAP for advanced motion
- Three.js or React Three Fiber for immersive 3D
- Lenis or native smooth-scroll patterns if appropriate
- use static optimization where possible

WHEN TO USE 3D HEAVILY
Use stronger 3D if the brand/site is:
- gaming
- entertainment
- AI/tech product
- automotive
- architecture
- fashion
- luxury
- futuristic SaaS
- portfolio
- product showcase
- event experience

WHEN TO USE 3D LIGHTLY
Use subtle 3D if the brand/site is:
- legal
- medical
- finance
- education
- government
- documentation-heavy
- trust-sensitive B2B

COPY AND CONTENT RULES
If copy is missing:
- generate premium, brand-aligned copy
- make headlines specific, sharp, and non-generic
- keep CTAs action-oriented
- preserve clarity over hype

CODE QUALITY RULES
Generated code must be:
- modular
- maintainable
- well-structured
- accessible
- responsive
- production-aware
- componentized
- easy to extend

If redesigning an existing codebase:
- preserve reusable parts where beneficial
- refactor weak patterns
- improve design system consistency
- remove dead styles/components
- improve maintainability

FINAL STANDARD
Do not deliver an ordinary website with a few animations.
Deliver a convincing immersive digital experience with strong design taste, strong UX logic, and production-grade engineering.

At the end, include:
1. a concise rationale for major design decisions
2. a list of libraries/tools used
3. performance precautions taken
4. fallback strategy for low-end/mobile devices
5. exact next implementation steps
```

## Compact version

This shorter version is useful for AI agents that perform better with a tighter instruction set while still preserving the main constraints and quality bar.[cite:1]

```text
Act as a world-class creative developer + 3D web designer + senior front-end architect.

Goal:
Create a fully immersive, highly responsive 3D website, or upgrade an existing website into a premium immersive 3D experience.

Requirements:
- Make it cinematic, interactive, elegant, conversion-focused, and production-ready.
- Use 3D only where it improves storytelling, brand perception, product understanding, or delight.
- Preserve usability, readability, accessibility, SEO, responsiveness, and performance.
- Avoid generic AI-looking design patterns and overused gradients/blobs/glassy clutter.

First:
1. Understand the brand, audience, goals, and whether this is a new site or redesign.
2. If existing site/code is provided, audit it and classify what to keep, improve, replace, remove, and upgrade to 3D.
3. Define a strong visual direction, motion language, and 3D interaction strategy.
4. Then build.

Deliver in this order:
A. Project understanding + assumptions
B. Experience concept
C. Sitemap / section plan
D. Design system
E. 3D system plan
F. Responsive behavior
G. Accessibility + SEO rules
H. Production-ready implementation
I. QA checklist

Enforce:
- premium typography and spacing
- immersive hero section
- layered scroll storytelling
- subtle but polished microinteractions
- mobile-safe adaptations
- reduced-motion fallback
- lazy loading and optimized assets
- semantic HTML and clear CTA hierarchy

Suggested stack if none is provided:
- Next.js / React
- Tailwind or modular CSS
- Framer Motion or GSAP
- Three.js or React Three Fiber

Final standard:
Do not make a normal website with random effects.
Make a cohesive immersive digital experience with strong UX, strong performance discipline, and clear business intent.
```

## Fill-in template

This version is designed for repeated reuse with project-specific variables so agents can anchor their output to clearer requirements and constraints.[cite:1]

```text
Create a highly immersive 3D website based on the following:

Brand/Product:
[INSERT]

Website type:
[landing page / SaaS / portfolio / ecommerce / studio / event / redesign / other]

Project mode:
[new build / redesign existing website]

Existing website/code/URL:
[INSERT OR N/A]

Target audience:
[INSERT]

Main business goal:
[INSERT]

Primary CTA:
[INSERT]

Required sections/pages:
[INSERT]

Preferred style/mood:
[cinematic / luxury / futuristic / minimal / bold / editorial / dark / light / other]

3D intensity:
[light / medium / high]

Preferred stack:
[INSERT OR “choose best”]

Must-have features:
[INSERT]

Performance priority:
[high / balanced / visual-first]

Accessibility level:
[standard / strong / strict]

SEO importance:
[low / medium / high]

Reference websites:
[INSERT]

Brand colors/fonts/assets:
[INSERT]

Now do the following:
1. Understand the project and list assumptions.
2. Create the experience concept.
3. Plan the structure and user journey.
4. Define the design system.
5. Define where and how 3D will be used.
6. Explain responsive behavior for mobile/tablet/desktop.
7. Define accessibility, SEO, and performance strategy.
8. Generate the implementation in production-ready form.
9. End with a QA checklist and next steps.
```

## Usage notes

For stronger results, include at least these five inputs before sending the prompt to another AI agent: website type, target audience, primary business goal, preferred stack, and desired 3D intensity.[cite:1]

Adding two or three reference sites plus a short note about whether the experience should feel more like a product page, brand experience, portfolio, or launch site usually improves stylistic consistency and output quality.[cite:1]

Example starter instruction:

```text
Redesign my AI SaaS landing page for founders and developers. The goal is demo bookings. Use Next.js + Tailwind + React Three Fiber. Keep 3D intensity medium. References: Apple product pages, Linear, and premium awwwards-style hero transitions.
```
