# Visual Refresh Correction Design

## Goal

Correct the earlier visual refresh direction so the redesign meaningfully changes screen structure rather than mostly recoloring existing layouts.

This correction applies specifically to the screens where the current implementation missed the intent:

1. `LoginScreen`
2. `HouseholdSetupScreen`
3. `HomeScreen`

The corrected redesign should feel like a layout overhaul, not a paint job.

## Problem Statement

The previous refresh improved theme consistency and surface styling, but it did not go far enough in structural composition.

Key issues to correct:

- too much of the redesign stayed within the same box/card stacking model
- `LoginScreen` repeats the same message across multiple regions instead of reducing friction
- `HouseholdSetupScreen` still reads like an intro panel above two similar forms rather than a real path choice
- `HomeScreen` still behaves like a collection of cards instead of a single primary working surface

The user feedback is accurate: the redesign needs stronger layout decisions, less repetition, and more confident screen purpose.

## Chosen Direction

The corrected direction is:

- keep the warm palette direction, but tune it darker and richer where useful
- keep the softer domestic tone
- push the structure much harder
- prioritize layout identity over decorative copy

This is not a full product rebrand. It is a focused structural redesign of the app’s entry and landing experiences.

## Updated Design Principles

### 1. Structure Must Change Before Styling

If a screen still reads as “the same layout with different colors,” it has failed the correction.

Every target screen should have:

- a clearer primary purpose
- fewer equivalent containers
- stronger hierarchy
- less repeated explanatory copy

### 2. Copy Must Support the Layout, Not Fill It

The earlier login redesign used repetition to occupy visual space. That is specifically out of bounds now.

For this correction:

- one message should appear once unless repetition serves a clear UX purpose
- decorative feature blocks should be avoided when they do not help the user act
- labels and support text should explain the next action, not restate it

### 3. One Dominant Move Per Screen

Each screen should have one main compositional idea:

- `LoginScreen`: a focused split welcome gate
- `HouseholdSetupScreen`: a true two-path decision surface
- `HomeScreen`: a command deck with one primary panel

The redesign should not feel like three variations of stacked cards.

## Palette Direction

The warm palette direction stays, but it should be tuned slightly richer and darker in the key screens.

### Core Tone

- warm neutrals remain the base
- terracotta remains the primary accent family
- the overall feel should be deeper and more confident than the lighter first pass

### Usage Guidance

- large statement surfaces may use deeper cocoa, clay, or sand-tinted treatments
- action contrast should be stronger than in the current implementation
- color should support hierarchy, but layout should do most of the work

The palette should feel more grounded and editorial, less soft-default and less pastel.

## Screen Designs

## 1. Login Screen

### Goal

Make login feel like a fast, focused entry gate instead of a branded copy collage.

### Structural Direction

The new login should use a split layout:

- left side: one strong welcome panel
- right side: the actual auth form

This screen should communicate confidence and clarity immediately. The form is the purpose. The welcome panel only needs to establish tone and context.

### Required Changes

- remove repeated explanation blocks
- remove stacked “support cards” that restate the same auth message
- reduce supporting copy to one headline and one concise supporting line
- keep mode switching (`login` / `register`) simple and close to the form
- make the form panel feel primary, not secondary

### Desired Experience

The user should feel:

- “I understand what this product is”
- “I know where to act”
- “I can sign in immediately”

not:

- “I’m reading the same sentence three times in different boxes”

### Responsive Behavior

- desktop: strong split gate
- mobile: stacked version of the same gate, with the form still visually dominant

## 2. Household Setup Screen

### Goal

Turn setup into a true fork in the user journey instead of an intro section plus two parallel forms.

### Structural Direction

The decision itself becomes the layout.

The screen should present:

- `Create household`
- `Join household`

as two distinct paths with different visual treatment, but equal visibility.

### Required Changes

- the intro area should orient the user briefly, not dominate the screen
- the create path and join path should feel intentionally different
- the create flow can read slightly warmer or more primary
- the join flow can read slightly cooler or more utility-oriented
- the two paths should feel like choices, not duplicate cards with different button labels

### Desired Experience

The user should immediately understand:

- “I am choosing between two ways in”
- “these are different actions”
- “I can commit to one path quickly”

### Responsive Behavior

- desktop: side-by-side dual-path decision layout
- mobile: stacked path sections, still clearly differentiated

## 3. Home Screen

### Goal

Make the landing screen feel like a command deck with one dominant working surface, not a pile of equal-priority cards.

### Structural Direction

The home screen should be organized around:

1. a top command area
2. one primary content panel
3. a supporting rail

### Required Changes

- the top section should become a true control deck, not just a hero banner with buttons
- quick actions should feel integrated into the command surface
- the activity feed should become the dominant main panel
- supporting modules should move into a secondary rail rather than competing with the main panel
- the overall composition should visibly break away from “large card + several smaller cards”

### Desired Experience

The screen should answer:

- where am I?
- what is happening right now?
- what is the most important thing I can do next?

with one immediate visual read.

### Layout Behavior

- desktop: strong two-zone composition with dominant main area and supporting rail
- mobile: preserve order and hierarchy so the screen still reads as one command deck with support beneath it

## What To Remove From the Current Implementation

The following patterns should be explicitly reduced or removed:

- repeated copy blocks in `LoginScreen`
- decorative panels that do not change decision-making
- multiple same-weight cards explaining the same action
- layouts that preserve the previous structure but change only radius and color
- support sections that compete equally with the main content

## Shared System Guidance

The current theme/token work is still useful and should remain the base, but the corrected implementation should not stop at shared tokens.

The next implementation must emphasize:

- composition first
- fewer containers
- stronger screen purpose
- more distinct desktop structures
- cleaner mobile collapse

The token layer should support the redesign, not define its limits.

## Implementation Bias

When implementation begins again, bias toward:

- deleting redundant layout sections rather than restyling them
- replacing stacked-card compositions with clearer panel structures
- using whitespace and composition to create hierarchy
- keeping copy short and purposeful
- making the form/action region the center of gravity on auth/setup screens

## Testing Expectations

The corrected implementation should verify:

1. `LoginScreen` no longer repeats the same auth message across multiple blocks
2. `LoginScreen` reads as a split gate on wide screens and collapses cleanly on mobile
3. `HouseholdSetupScreen` clearly presents two distinct entry paths
4. `HomeScreen` has one dominant primary panel and a visibly secondary support rail on wide screens
5. Existing auth, setup, dashboard loading, and navigation behaviors still work exactly as before

## Out of Scope

- rewriting backend logic
- changing navigation routes
- redesigning every feature screen beyond the three corrected targets
- marketing-site storytelling
- introducing new product flows

## Recommended Next Step

The next implementation plan should treat this as a correction pass over the existing branch work, not as incremental polish.

The implementation should first replace the current `LoginScreen`, `HouseholdSetupScreen`, and `HomeScreen` layouts, then verify that the shared shell and tab styling still support the stronger structures cleanly.
