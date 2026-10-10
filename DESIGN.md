# DESIGN.md — UI rules for Sigrid

These rules are **mandatory** for anyone building UI in this repo, people and AI agents alike.
The visual reference is the design-system Storybook in the `sewing-app` repo (`npm run storybook` → http://localhost:6006).
This repo carries a copy of that system: tokens in `app/globals.css`, shadcn components in `components/ui/`, app patterns in `components/patterns/`.

> **Brand: Sand.** Scandinavian-luxury minimal: warm sand and espresso, one clean sans (Albert Sans),
> square edges, hairlines instead of shadows, small uppercase labels and lots of air. Calm, trustworthy, easy to read.
> All tokens live in `app/globals.css`; the brand layer at the bottom of that file applies the structural rules below.

## Legacy code (sewing guide)

The sewing guide (`app/garment/[id]/guide`, `app/garment/[id]/pattern`, `components/sewing/*`, `components/legacy/*`) predates this system.
It still uses the old names (`bg-surface`, `text-ink`, `bg-primary-soft`, `var(--sig-*)`, `text-heading`…). Those are aliases onto the
design tokens (see the bottom of `app/globals.css`). Its buttons, chips and tags have been restyled to the brand (square, small caps,
neutral step tags, 44px controls), so it matches visually; only its code structure is legacy.
**Never use the legacy names or `components/legacy/*` in new code.** When the guide is reworked, move it onto `components/ui` and delete the aliases.

## 0. Workflow

1. **Storybook first.** Before building a screen, check Storybook for an existing component or pattern.
2. **Missing piece?** Add it to `components/patterns/` (or `npx shadcn@latest add <name>` for a shadcn component), and add a matching story to the Storybook in the `sewing-app` repo.
3. **Compose, don't restyle.** Screens in `app/` are built from `@/components/ui/*` and `@/components/patterns/*`. Avoid long one-off `className` strings in pages; if you need one, it probably belongs in a pattern.
4. **Check both themes and mobile.** Every new story must look right in light and dark mode (Theme toolbar) and at 375px wide, and must show no violations in the Accessibility panel.
5. Don't edit files in `components/ui/` to change their look. Those are shadcn source files; wrap them in a pattern instead. (Bug fixes are OK.)

## 1. Stack

| Thing | Use | Never |
| --- | --- | --- |
| Styling | Tailwind CSS v4 utilities | CSS modules, inline `style` for colours/spacing, styled-components |
| Components | shadcn/ui (`base-nova`, Base UI primitives) in `components/ui/` | Other component libraries (MUI, Chakra, Radix-only copies, …) |
| Sewing patterns | `components/patterns/` | Duplicating a pattern inline in a page |
| Icons | `@tabler/icons-react` | Emoji as icons, lucide, inline SVG copies |
| Class merging | `cn` from `"cn"` | String concatenation of class names |
| Font | Albert Sans for everything (`font-sans`, `font-heading`); Geist Mono (`font-mono`) for code only | Any other font, serifs, display faces |

Base UI note: triggers compose with `render={<Button … />}`, **not** `asChild`.

## 2. Colour — Sand palette

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#EFE9E0` sand | Page |
| `card` / `popover` | `#F5F0E8` | Raised surfaces, sheets, menus |
| `muted` / `secondary` / `hero` | `#E5DDD1` | Panels, product image backgrounds, the Home "continue" panel |
| `foreground` / `primary` | `#2A2420` espresso | Text, main buttons, selected states, progress |
| `muted-foreground` | `#5A5149` | Secondary text (5.8:1 on muted) |
| `border` / `input` | `#D8CEBF` / `#C9BDAB` | Hairlines, field borders |
| `celebrate` | `#9C6B4E` clay | Tiny accents only (the wordmark dot). Never large areas |
| `destructive` / `success` / `warning` / `info` | `#9E3328` / `#465F44` / `#7D5B15` / `#4B5E70` | State only, always with text or an icon |

- Only semantic token utilities (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-muted`…). No raw colours, no `bg-white` / `text-black`.
- The page is almost colourless on purpose: espresso on sand. Colour is never decoration.
- **One `primary` action per screen or dialog.**
- New tokens go in `:root` in `app/globals.css` (and the `@theme inline` mapping) and must pass AA contrast.

## 3. Typography — Albert Sans

One typeface for headings and text. Normal case for headings; uppercase only for small labels.

| Role | How |
| --- | --- |
| Page title (`h1`, one per screen) | `h1` — brand layer sets size (32–52px), weight 500, tracking −0.02em |
| Section heading (`h2`) | `h2` via `PageSection` — 22px, weight 500 |
| Card / panel title | `CardTitle` (uses `font-heading`) |
| Body | `text-sm` default; instructions `text-base leading-relaxed` |
| Secondary | `text-sm text-muted-foreground` |
| Label / eyebrow | `eyebrow` class — 12px, uppercase, 0.12em tracking |
| Buttons, tabs, navigation | Uppercase 12px with letter-spacing (applied by the brand layer, don't add classes) |

- Weights: 400 and 500. No bold display type.
- `tabular-nums` on measurements, quantities, step counts and percentages.
- Reading text max width `max-w-prose`.

## 4. Layout, shape and surfaces

- **Mobile first** (375px), then `sm` / `md` / `lg`. Screens use `PageContainer` (adds generous section spacing) and `PageHeader`.
- **Square edges:** `--radius` is 2px. Don't add `rounded-xl` / `rounded-full` to surfaces or buttons (avatars and the size-tile grid are the only round-ish things).
- **Hairlines, not shadows:** cards and panels are flat with a 1px `border`. No `shadow-*`, no gradients, no textures.
- **Product tiles** (`GarmentCard`) have no box: a portrait (4:5) image panel on `muted`, then name (small caps), an optional creator line, one quiet detail line (`Beginner · 3–4 hours`) and the price. Grids use `gap-x-4 gap-y-8`.
- **Filters** are text tabs with an underline: use `CategoryTabs` (scrolls sideways on phones with a fading edge). **Navigation** is text-only small caps with an underline for the current page.
- **Progress** is a single 2px hairline.
- **Horizontal rows** (filters, carousels) use the `scroll-row` class so they keep the page gutter and fade at the edge on phones.
- **Destructive buttons** are outlined text in the destructive colour, never a filled red block.
- Primary action on mobile sits in a sticky bottom bar, full width. Touch targets ≥ 44×44px.

## 5. Components: which one to use

| Need | Use |
| --- | --- |
| Main action | `Button` (default), max one per view |
| Secondary action | `Button variant="outline"` |
| Quiet action | `Button variant="secondary"` or `ghost` |
| Delete / reset | `Button variant="destructive"` + `AlertDialog` confirm |
| Icon-only action | `Button size="icon-lg" variant="ghost"` + `aria-label` + `Tooltip` |
| Text input | `Field` > `FieldLabel` + `Input` + `FieldDescription`/`FieldError` |
| Body measurement | `MeasurementField` pattern |
| Pick a size | `SizePicker` pattern |
| 2 options | `Switch` (setting) / `Checkbox` (agree, have item) |
| 2–5 visible options | `RadioGroup` or `ToggleGroup variant="outline"` |
| 6+ options | `Select` |
| Approximate value | `Slider` (never for exact measurements) |
| Switch views of one thing | `Tabs` (≤ 4) |
| Group one thing | `Card` (never nested) |
| Garment in a list | `GarmentCard` pattern (whole tile is the link) |
| Filter a grid by category | `CategoryTabs` pattern |
| Resume the current project | Home's continue panel: eyebrow → name → "Next: step" → progress → one primary button |
| A started project in a list | Project row (Projects page): image, name, size and steps, next step, progress, Continue + Details |
| Fabric / tool row | `MaterialItem` pattern |
| Sewing step content | `InstructionStep` pattern |
| Step navigation / progress | `StepList` pattern |
| Screen top bar | `AppHeader` pattern |
| Section with heading | `PageSection` pattern |
| Persistent notice / tip | `Alert` (tip = `IconBulb`) |
| Quick confirmation | `toast()` from `sonner` |
| Short task (desktop / mobile) | `Dialog` / `Drawer` |
| Side panel | `Sheet` |
| Item actions | `DropdownMenu` |
| Loading content / action | `Skeleton` / `Spinner` in the button |
| Nothing here yet | `Empty` with one next action |
| Size chart | `Table`, numbers right-aligned |

## 6. Product rules (sewing-specific)

- **Viewing a step ≠ completing a step.** Progress (`upcoming | active | done`) changes only on an explicit user action ("Mark as done"). Opening, scrolling to, or navigating past a step never changes progress. The step on screen is marked with `aria-current="step"`, separately from its status.
- Any action that resets progress (e.g. changing size) needs an `AlertDialog` that says what will be lost.
- The recommended size is labelled, never silently selected.
- Measurements always show their unit inside the field and use `inputMode="decimal"`.
- Instructions: one action per sentence, numbers with units ("1.5 cm"), tips in an `Alert` with `IconBulb`.

## 7. Icons

- Tabler only, stroke style, default stroke width. Colour inherits (`currentColor`).
- Inside buttons/menus/inputs, don't set a size (component handles it). Inline: `size-4`. List tiles: `size-5`. Empty/media: `size-8`.
- Decorative icons get `aria-hidden`. Same meaning → same icon everywhere.
- No emoji for anything functional (tools, categories, status, actions).

## 8. Motion

Quiet and purposeful. Everything below is already wired up; reuse it rather than adding new effects.

| What | How |
| --- | --- |
| Sections rise in on page load | Automatic for children of `PageContainer` (`.page`), staggered 70ms |
| Product grids stagger in | Add `tile-grid` to the grid; give it a `key` tied to the active filter so it replays on change |
| Sliding underline (tabs, nav) | `CategoryTabs` and the app navigation use framer-motion `layoutId` |
| Progress draws in | Automatic on every `Progress` |
| Arrow nudge on hover | Automatic for buttons with `data-icon="inline-end"` |
| Product image hover | `GarmentCard` eases the garment up 4% |

- Easing `--ease-out-soft` (cubic-bezier(.2,.7,.2,1)); 0.25s for feedback, 0.6–0.7s for content entering.
- No bounce, no looping, no parallax. `prefers-reduced-motion` is respected globally (CSS) and in framer-motion (`MotionProvider`).

## 8b. Product imagery

Until real photography exists, garments are shown with `GarmentImage` / `GarmentArt`: the silhouette in a muted Scandinavian
fabric colourway (oat, clay, olive, charcoal, rose, navy…) with soft shading, a fine weave and a ground shadow, on a studio
backdrop tinted to the fabric. Fabric colours are content, so they live in `components/garment/GarmentArt.tsx`, not in the tokens.
Never show a garment as a bare outline in an empty box.

## 9. Accessibility (WCAG 2.2 AA)

- Contrast ≥ 4.5:1 for text, ≥ 3:1 for UI parts (semantic tokens already pass).
- Everything works by keyboard; focus is always visible (built in; don't remove `focus-visible` styles).
- Every input has a visible label. Placeholders are examples, not labels.
- Errors are text under the field + `aria-invalid`, shown on blur/submit.
- Icon-only buttons have `aria-label`. Meaningful images have `alt`; decorative ones `alt=""`.
- One `h1` per screen; headings in order.

## 10. Writing

- Sentence case, plain words, short sentences. Address the user as "you".
- Buttons: verb first, 1–3 words ("Start sewing", "Save measurements"). Never "OK", "Submit", "Click here".
- Errors say what happened and what to do ("Check your connection and try again.").
- Calm and plain: no jokes, slang or exclamation marks. Short sentences, one idea each.

## 11. Before you call UI work done

- [ ] Uses only `components/ui` and `components/patterns` pieces shown in Storybook (or new ones were added there with stories)
- [ ] No raw colours, arbitrary values, emoji icons, extra fonts, shadows, gradients or large radii
- [ ] At most one primary button per view
- [ ] Looks right at 375px and desktop, light and dark
- [ ] Keyboard works, focus visible, Accessibility panel clean
- [ ] Progress state only changes on explicit user action
