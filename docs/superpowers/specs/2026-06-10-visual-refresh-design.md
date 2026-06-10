# Visual Refresh Design

## Goal

Overhaul the visual design of OthelloCloud so the app feels more modern, polished, and intentional while staying approachable for shared household use.

The redesign should move the product away from its current generic blue Material-style presentation and toward a warmer, softer interface with stronger hierarchy, better spacing, and a more distinct brand personality.

## Chosen Direction

The selected direction is:

- `Soft Home` overall product feel
- `Balanced warmth` rather than either subtle neutrality or heavy lifestyle styling
- `Clay & Linen` as the palette and visual system anchor
- `Focused Screen Overhaul` as the recommended implementation scope

This means the redesign should feel:

- Warm but still structured
- Friendly without becoming playful
- Modern without looking like a generic SaaS dashboard
- Calm enough for repeated daily use

## Why This Direction Fits OthelloCloud

OthelloCloud is a shared household app, not a finance tool, admin console, or analytics product. The current UI structure is functional, but its visual language is still close to default component-library styling:

- blue-first accenting
- relatively dense card usage
- modest hierarchy between sections
- a standard bottom-tab shell
- minimal product-specific visual identity

The chosen direction keeps the app reliable and readable while making it feel more tailored to household coordination. It should feel more like a thoughtfully designed home-life product than a repurposed dashboard starter.

## Scope Recommendation

### Recommended: Focused Screen Overhaul

The first implementation pass should redesign the highest-impact shared surfaces:

1. `LoginScreen`
2. `HouseholdSetupScreen`
3. `HomeScreen`
4. shared `AppScreen` shell
5. shared tab bar styling in `MainTabs`
6. reusable card, spacing, and action treatments used by those screens

This scope gives the product a visibly new identity without forcing a full restyle of every screen before the design language is proven in code.

### Not Recommended for First Pass

- A token-only refresh with no layout changes
- A full-screen-by-screen rebrand across the entire app in one step

The first option will not feel transformative enough. The second creates too much coordination overhead before the core design system is validated.

## Visual Identity

### Design Keywords

The interface should feel:

- warm
- airy
- rounded
- calm
- domestic
- polished
- lightly editorial

Avoid:

- default corporate dashboard energy
- high-gloss fintech aesthetics
- heavy outlines and harsh contrast
- childish illustration-driven design
- overuse of saturated color

### Core Palette

Primary palette for the redesign:

- Terracotta: `#B85C38`
- Warm sand: `#EBC5A8`
- Linen background: `#FFF7F1`
- Sage accent: `#8FA68E`
- Deep cocoa text: `#4F342B`

### Supporting Neutrals

Recommended support tones:

- Page wash: `#F6EFE8`
- Elevated card: `#FFFDFC`
- Soft border: `#E7D7C9`
- Muted text: `#7F5B47`
- Disabled / low emphasis: `#B7A08F`

These should replace the current colder blue-gray assumptions used across backgrounds, containers, and borders.

### Color Usage Model

- Use `Terracotta` for primary actions, selected states, and key emphasis
- Use `Sage` sparingly for supportive accents, success-leaning states, and secondary highlights
- Use `Warm sand` and `Linen` to build atmosphere in hero areas and elevated panels
- Keep most large surfaces very light so the app stays breathable
- Use `Deep cocoa` and `Muted text` instead of pure charcoal-black for typography

The app should read as warm at first glance without becoming visibly tan or orange everywhere.

## Typography Direction

Typography should do more work in the redesign than it does today.

### Desired Behavior

- Page titles should feel more prominent and intentional
- Small labels should feel quieter and more refined
- Card titles should not all have identical visual weight
- Hero sections should establish emotional tone quickly

### Style Guidance

- Use larger, more spacious page headings
- Increase contrast between heading, supporting copy, and metadata
- Prefer cleaner sentence-case presentation over all-caps except for very small eyebrow labels
- Keep label text restrained and infrequent

Because the current app uses React Native Paper, implementation may still rely on system typography primitives, but the scale, spacing, and weight choices should feel curated rather than default.

## Shape, Surfaces, and Depth

### Corners

Move toward softer, more modern radii:

- Hero panels: `24-28px`
- Standard cards: `18-22px`
- Inputs and pill controls: `14-18px`
- Small buttons and chips: rounded or pill-shaped where appropriate

The current `8px`-leaning card language feels too generic and rigid for the desired direction.

### Surfaces

The redesign should reduce the feeling of stacked white rectangles.

Recommended behavior:

- Introduce tinted page backgrounds rather than flat neutral gray
- Use slightly warm elevated surfaces instead of stark white everywhere
- Let hero sections use soft gradients or tonal transitions
- Reduce border harshness and rely more on spacing, radius, and tonal separation

### Shadows

Shadows should be present but subtle:

- soft blur
- low opacity
- warm-neutral tint if feasible

Avoid heavy floating-card shadows or no-depth-at-all flatness.

## Layout Direction

### General Layout Principles

- More breathing room between sections
- Fewer cramped control clusters
- Clear hero area at the top of key screens
- Better rhythm between headline areas and supporting content
- Reduced dependence on identical stacked cards

### App Shell

`AppScreen` should evolve from a utility wrapper into a more branded shell.

Recommended adjustments:

- Replace the current translucent generic header block with a more intentional warm container or lighter integrated top area
- Increase vertical rhythm around the page title
- Refine the brand treatment so it feels more premium and less placeholder
- Better unify the language selector, theme toggle, and right-side actions into the shell design

### Tab Bar

`MainTabs` should feel more deliberate and less default-navigation-like.

Recommended changes:

- Softer top border or no visible hard divider
- Slightly more sculpted tab bar container
- Better active-state treatment than color alone
- More warmth in the base surface
- Icon and label styling that feels integrated with the rest of the design system

The tab bar should still remain familiar and easy to scan, especially on mobile.

## Screen-Specific Design

### 1. Login Screen

The login experience should shift from a plain form-in-card layout to a clearer brand entrance.

Desired changes:

- prominent welcome hero or brand intro area
- warmer background treatment
- more elegant form card styling
- stronger distinction between primary and secondary actions
- better emotional tone for first-time use

The result should feel like entering a product with identity, not a default auth template.

### 2. Household Setup Screen

This screen should feel optimistic and guided rather than purely transactional.

Desired changes:

- clearer split between `Create household` and `Join household`
- more intentional two-path layout on wide screens
- warmer explanatory copy blocks or intro section
- action styling that makes the preferred next step easier to understand

This is a key onboarding moment and should benefit strongly from the new visual language.

### 3. Home Screen

The existing home dashboard already establishes a stronger landing experience, so the redesign should elevate rather than reinvent it.

Desired changes:

- richer hero treatment using tonal warmth rather than blue emphasis
- more breathing room between dashboard regions
- lighter-feeling support cards
- cleaner hierarchy in activity feed content
- quick actions styled as part of the product identity instead of standard button groups

This screen should become the clearest expression of the new brand direction.

### 4. Shared Utility Screens

After the initial overhaul, the same design language should extend to:

- expenses surfaces
- calendar containers
- polls cards and creation flows
- shopping list states
- profile/settings sections

That later pass should reuse the same tokens and interaction rules instead of inventing per-screen styling.

## Component Design Guidance

### Buttons

- Primary buttons should use terracotta and feel tactile but not loud
- Secondary actions should prefer tinted or tonal treatments over plain outlined defaults
- Text-only actions should be used deliberately, not as the fallback for every secondary button

### Cards

- Cards should vary in emphasis based on purpose
- Not every section needs identical card chrome
- High-priority containers can use warmer tinting or stronger radius
- Low-priority containers can be quieter and lighter

### Inputs

- Inputs should feel softer and more integrated into the warm palette
- Outlined fields can remain, but outlines should be less stark
- Focus, error, and filled states should be tuned to the new palette

### Lists and Rows

- List rows should feel lighter and less boxed
- Use spacing and subtle dividers instead of strong separation
- Metadata should be easier to scan at a glance

### Empty States

Empty states should benefit significantly from the new design.

Desired behavior:

- softer language
- more inviting framing
- better spacing
- lightweight visual warmth even without custom illustration work

## Motion and Interaction

The redesign should include small but meaningful polish where practical:

- slightly softer state transitions
- clearer pressed/selected states
- smoother emphasis changes for tabs and quick actions

Motion should support calmness, not novelty. Avoid bouncy or attention-seeking animations.

## Responsive Behavior

The refreshed design must still work well across web desktop and mobile layouts.

Key expectations:

- hero sections remain readable and balanced on small screens
- warm atmosphere should survive responsive collapse
- cards should not become visually heavy when stacked
- tab bar remains touch-friendly and uncluttered

Any layout enhancements on desktop should degrade gracefully into clean vertical stacking on mobile.

## Accessibility and Readability

The redesign should not trade clarity for style.

Requirements:

- preserve strong text contrast despite the warmer palette
- ensure interactive states remain obvious
- avoid pale text on tinted surfaces
- preserve comfortable touch targets in tab and action areas
- keep decorative color from becoming semantic-only signaling

Warmth should come from tone and composition, not from reducing legibility.

## Implementation Notes for Current Codebase

The redesign should build on the current structure rather than fight it.

Observed implementation anchors:

- `frontend/App.tsx` currently defines the theme colors and navigation colors
- `frontend/components/app-screen.tsx` centralizes screen shell spacing and top-page structure
- `frontend/src/screens/MainTabs.tsx` owns the tab bar styling
- `frontend/src/screens/LoginScreen.tsx` and `frontend/src/screens/HouseholdSetupScreen.tsx` are strong candidates for first-pass redesign
- `frontend/src/screens/HomeScreen.tsx` already provides a hero-based layout that can be visually elevated

This suggests the first implementation should introduce a clearer shared design token layer before updating the key screens.

## Testing Expectations

Implementation should verify:

1. The new theme remains readable in both light and dark modes if dark mode is preserved in this pass
2. The redesigned auth and setup flows remain usable on narrow mobile widths
3. The home dashboard still works with live and empty states after the visual overhaul
4. The tab bar remains stable across mobile and wide layouts
5. Shared shell changes do not regress existing screen spacing or navigation behavior

## Out of Scope for This Design

- changing product workflows
- adding new backend capabilities
- rewriting navigation structure beyond visual refinement
- introducing illustration systems or marketing-site style storytelling
- rebuilding every existing feature screen before the shared design language is validated

## Recommended Implementation Bias

When implementation begins, bias toward:

- warmer neutrals over cool defaults
- fewer but better-emphasized containers
- stronger top-of-screen storytelling
- more distinctive but restrained action styling
- consistency through shared tokens rather than one-off screen overrides

The final result should feel unmistakably newer, softer, and more product-specific while still remaining dependable for everyday household coordination.
