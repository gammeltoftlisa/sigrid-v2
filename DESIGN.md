# DESIGN.md: UI rules for Sigrid

These rules are **mandatory** for anyone building UI in this repo, people and AI agents alike.
The visual reference is the Storybook in the `sewing-app` repo (`npm run storybook`, http://localhost:6006), which documents the components in this repo.

Where things live here: tokens and the brand layer in `app/globals.css`, shadcn components in `components/ui/`, patterns in `components/patterns/`, imagery in `components/garment/`.
The sewing guide (`components/sewing/`, `components/legacy/`) is older code; don't use `components/legacy` in new code.

> **Brand: liquid glass, warm editorial atelier.** Built on the `liquid-glass-frontend` skill (`.claude/skills/liquid-glass-frontend`, read its `references/` before UI work).
> Real Apple-style frosted glass over a calm page: a cutting mat as the floor, seen from low down looking towards the top right, on a stipple of tiny dots (`Atmosphere`), in black, white and beige. A characterful serif (Fraunces) does the talking, with italic accents and small mono kickers.
> **Signature moment:** page titles wipe up from behind a mask. Calm copy, confident type.

## 0. Workflow

1. **Storybook first.** Before building a screen, look for an existing component or pattern in Storybook.
2. **Missing piece?** Add it as a pattern (or `npx shadcn@latest add <name>` for a shadcn component), then a story for it in the Storybook.
3. **Compose, don't restyle.** Screens are built from `components/ui/*` and `components/patterns/*`. If a page needs a long one-off `className`, it belongs in a pattern.
4. **Check phone and laptop, light and dark.** Every story must look right at 375px and on a laptop in both themes, with no violations in the Accessibility panel.
5. **Don't restyle `components/ui/`.** Those are shadcn source files; the brand layer in the global CSS styles them. Bug fixes are fine.
6. **Keep the Storybook in step.** After changing components, run `node scripts/sync-from-app.mjs <path to sigrid-v2>` in the `sewing-app` repo, then update the stories.

## 1. Stack

| Thing | Use | Never |
| --- | --- | --- |
| Styling | Tailwind CSS v4 utilities and the tokens below | CSS modules, inline `style` for colours or spacing, arbitrary values (`text-[…]`, `w-[…]`, `#hex`) |
| Components | shadcn/ui (`base-nova`, Base UI primitives) | Other component libraries |
| Patterns | `components/patterns/` | Rebuilding a pattern inline in a page |
| Icons | `@tabler/icons-react` | Emoji, other icon sets, inline SVG copies |
| Class merging | `cn` from `"cn"` | String concatenation |
| Fonts | Fraunces for display (`font-heading`, every `h1`/`h2`), Be Vietnam Pro for text (`font-sans`), JetBrains Mono for kickers and badges (`font-mono`) | Inter, Roboto, system-ui as the character face; any other font |
| Motion | `motion` (`motion/react`) | `framer-motion` imports |

Base UI note: triggers compose with `render={<Button … />}`, **not** `asChild`. A `Button` rendered as a link needs `nativeButton={false}`.

## 2. Colour

**One source of truth:** three RGB triplets in `:root`. There is no brand colour for now, only black, white and beige: `--tri-primary` ink `#211C16` (bone on dark), `--tri-primary-soft` beige `#B0A694`, `--tri-accent` beige `#C4BAA8`, on obsidian `#15110D` and ivory `#EFEADE`. Main buttons are black (light in dark mode). Status colours stay functional. Every tint is `rgb(var(--tri-primary) / 0.x)`. Re-skin by editing those three lines.

Themes: `next-themes` sets `<html data-theme="light|dark">` (system by default, switch in Profile → Appearance). The brand stays the same; only the `--app-*` surface tokens and `--aura` change. shadcn names point at them, so components never know the theme.

| Token | Light / dark | Use |
| --- | --- | --- |
| `--app-bg` → `background` | `#EFEADE` / `#15110D` | The page, under the atmosphere |
| `--app-panel` | `#FFFFFF` / `#1C1C1C` | Solid surfaces; neutral, only the page is warm |
| `--glass-fill` / `-inset` / `-solid` / `-bar` / `-menu` | `--glass-fill` white at 45% (7% on dark), `-inset` transparent, `-solid` / `-bar` / `-menu` white at 80 / 78 / 90% (near-black on dark) | Every glass surface |
| `--app-elev` | `#FFFFFF` / `#2B2B2B` | Solid fills, such as a focused field |
| `card` → `--glass-inset` | see above | Insets: what sits on glass |
| `--app-text` → `foreground` | `#211C16` / `#F0ECE1` | Text |
| `--app-text-soft` → `muted-foreground` | `#625746` / `#A79C8C` | Secondary text (AA on every surface) |
| `--app-border` / `-strong` | ink or bone at 10% / 20% | Hairlines on glass, field and button edges |
| `primary`, `brand`, `ring` | ink (bone or beige on dark) | Progress, chosen states, focus on fields |
| `--accent-ink` | ink / beige | Italic headline accents, kickers |
| `success` / `destructive` / `warning` / `info` | deep tone for text, `-solid` for the accent; lighter tones in dark | State only, with text or an icon (`StatusBadge`, `StatusMessage`) |
| `data-1` … `data-4` | one neutral hue, light → dark (reversed in dark) | Charts and the heatmap |

- Only token utilities (`bg-card`, `text-muted-foreground`, `bg-data-2`). Never `bg-white`, `text-black` or hex in components; the print sheet is the one exception.
- **One primary action per screen or dialog.**
- New tokens go in `:root` **and** `:root[data-theme="dark"]`, and must pass AA in both.

## 3. Surfaces: liquid glass

**Everything sits in a container, never on the background.** Only titles, body text, buttons and button groups may sit directly on the page.

**Products have their own container.** A product (photo plus text) always sits in `ProductGrid`: a solid fill a little lighter than the page (`--product-fill`) with the page's dots. A page shares one container for all its products, with a stroke between them instead of a box around each. The same goes for products in a labelled section (`ProductGrid label="…"`). Never put products directly on the background or in a glass `Panel`. A single large photo uses `ProductFrame`.

Glass is **one material, whatever its size**: white: a white tint (`--glass-fill`) + `--glass-blur` + a 1px top edge. `--glass-blur` drains the colour, lifts it towards white and blurs. Never darken it or raise its contrast: that turns small differences in the page into gray. A panel, a secondary button and a button group look the same. Whatever sits inside glass adds no fill of its own (`--glass-inset`), so it looks the same there as on the page. Only the page is warm: no cream tints on glass and no `saturate()`, which turns the warm page yellow. Only surfaces that text scrolls under are thicker: fixed bars, sheets and dialogs, menus. `Atmosphere` (in the root layout) draws the mat and a stipple of tiny dots behind every screen. No drifting blobs, no moving fades.

| Material | What | How |
| --- | --- | --- |
| Surface | panels, cards, alerts, the segmented control | `Panel`, `glass-panel`, `glass-surface`; automatic on `Card` and `Alert` |
| Soft | floating bars: rail, tab bar, `ActionBar`; sheets and dialogs. Bars fixed over scrolling content are thicker (`--glass-fill-bar`) so labels stay readable | `glass` / `glass-surface-soft`; automatic on sheets and dialogs |
| Menu (~82% solid) | dropdowns, popovers, tooltips, toasts | automatic; `glass-menu` for custom popovers |
| Inset (no blur) | everything **inside** glass: rows, fields, chips, buttons, tiles | `PanelRow`, `Inset`, `DetailList`; fields and buttons turn inset automatically |
| Glass pill | primary and outline buttons on the page | automatic on `Button` |

- **Never animate `opacity`, `filter` or `mask` on glass or on anything that contains it, even with a fill-forwards animation that has ended.** The browser then cuts the glass off from the page: its computed styles look right, but there is nothing behind it to blur. Entrance animations move only (`sg-rise`).
- **Never nest `backdrop-filter`.** Inside glass, use the inset (tint + sheen). The global CSS does this for shadcn parts.
- **No `mix-blend-mode` anywhere, including on `::before`/`::after` and in shadcn parts.** One blended element on screen stops every glass surface from blurring, even a tiny avatar border, so glass changes as you scroll. Texture goes inside `Atmosphere`, behind the content.
- Light and dark use the same glass recipe; only the tokens differ.
- Popovers render in portals at the root (Base UI does this), so `backdrop-filter` stacking contexts never trap them.
- Product photos and reading text are never glass. Labels on photos use `PhotoLabel`.
- Reduced transparency turns glass solid and hides the atmosphere.

## 4. Shape

| Token | Value | Use |
| --- | --- | --- |
| `rounded-(--radius)` | 22px | Panels, cards, sheets |
| `rounded-(--control-radius)` | 14px | Fields, white rows, `Inset`, size tiles |
| `rounded-full` | | Every button (pills), badges, avatars, chips on photos |
| `rounded-(--image-radius)` | 16px | Photos |
| `rounded-pane` / `rounded-pane-lg` / `rounded-pane-inner` | 22 / 28 / 24px | The floating rail, tab bar, action bar and their inner pills |
| `rounded-xs` | 4px | Heatmap cells, tiny marks |

Image shapes: `aspect-product` (4:5, product tiles), `aspect-cover` (4:3, project cards), `aspect-wide` (2:1, maker covers).

## 5. Type and spacing (the rhythm)

**Typography is the design.** Big, characterful and mixed: a roman line, then an italic ink line.

| Type | Size | Use |
| --- | --- | --- |
| `kicker` / `eyebrow` | 11px mono, 0.22em tracking, uppercase | Above titles, panel labels (`kicker` is ink) |
| `text-xs` | 13px | Details, meta, captions, field labels |
| `text-sm` | 15px | Body, lists (the default UI size) |
| `text-base` | 17px | Lead text under a title, reading text |
| `page-section-title` | 26–36px Fraunces 380 | Section titles (`PageSection`) |
| `h1` | `clamp(2.75rem, 6.2vw, 5.75rem)`, Fraunces 360, leading 0.95 | The page title, one per screen |
| `hero-title` | `clamp(3.5rem, 9vw, 8.5rem)`, leading 0.9 | `HeroBand` only |

Put the line that carries the feeling in `<em className="display-italic">` (italic, WONK axis, ink). Body is Be Vietnam Pro 400, emphasis 500. `tabular-nums` on measurements, counts and prices. Reading text is `max-w-prose`.

| Space | Use |
| --- | --- |
| 4px (`gap-1`) | Lines inside one item: name → meta → price |
| 8px (`gap-2`) | Related items: rows in a panel, chips, tiles in a stat grid |
| 12px (`gap-3`) | Image → text, label → control |
| 16px (`p-4`, `gap-4`) | Inside a component: panel padding, section title → content |
| 24px (`gap-6`) | Between panels in a column |
| 32px | Page title → content (built into `PageHeader`) |
| 40 / 48px | Between page sections, phones / from `md` (built into `PageContainer`) |

Half steps (`px-2.5`, `py-1.5`) are only for padding inside small controls and pills. Never between things.

## 6. Controls

| Control | Height | Notes |
| --- | --- | --- |
| Fields and dropdowns | 36px (44px on touch) | 14px text, 12px side padding, 14px corners, 16px muted icons |
| Button | 40px | `size="lg"` (44px) for the one main action |
| Small button and chips | 32px (40px on touch) | `size="sm"`; filter chips, removable filters, the bag |
| Icon button | 36–44px | `size="icon-lg"` in bars, always with `aria-label` |

- Chips and size tiles are frosted, ink when chosen.
- Labels: 13px medium, 8px above the field. Every field has a visible label; placeholders are examples.
- While you type, a field turns solid with a ink edge and a soft ink ring.
- The slider is a 2px ink track with small glass handles; it can always be typed into as well.
- Touch targets are at least 44×44px on phones.

## 7. Layout

- **Mobile first** (375px). Screens use `PageContainer` and `PageHeader` inside `AppShell`. Tab screens that need a big moment use `HeroBand`: a stacked headline on one side, copy and actions anchored to the *bottom* of the other.
- **Vary the treatment.** Siblings don't all share one shape: a product grid leads with a `GarmentCard lead` (twice as wide and tall, with its description), and adjacent sections use different patterns (hero band → glass panel → bento grid).
- **Navigation**: from `md`, a floating glass icon rail (`AppSidebar`); on phones, a floating glass tab bar (`AppTabBar`). Pages leave room with `pb-tabbar`. The phone's main action goes in an `ActionBar` above the tab bar.
- **12-column grid**: one grid, one gutter (16px on phones, 24px from `md`). Never one-off `grid-cols-[…]`.
  - `grid-12` is the page grid. `col-side` (4 columns on `lg`, 3 from `xl`, sticky 8px from the top like the rail) and `col-main` (the rest) make the two-column workspace.
  - `tiles` is the product grid: 2 per row on phones, 3 on tablets, 4 on laptops; 5 when full width from `xl`, 4 beside a side panel. Add `tile-grid` to stagger them in; `tiles-compact` for tighter rows (project cards).
  - `tiles-wide` is for bigger cards: 1, then 2, then 3 per row.
- **Top line**: `PageHeader` (or `TopBar`) shows back, breadcrumbs and quick actions as plain text on the page, no container.
- **Side sheets**: `PanelSheet` (full width on phones, 448px from `sm`).
- **Show only what's needed.** Fewer panels, fewer words, one main action.

## 8. Which component to use

| Need | Use |
| --- | --- |
| The big top of a tab screen | `HeroBand` (kicker, lines, description, actions) |
| A page title | `PageHeader` (optional `kicker`); it wipes in by itself |
| Headline lines that wipe in / content that rises after them | `MaskedLine` / `Rise` from `components/patterns/reveal` |
| Main / secondary / quiet action | `Button` (black, stitched) / `variant="outline"` (frosted pill) / `variant="ghost"` |
| Delete or reset | `Button variant="destructive"` (outlined text) + `AlertDialog` that says what will be lost |
| Icon-only action | `Button size="icon-lg"` + `aria-label` |
| Text input | `Field` > `FieldLabel` + `Input` |
| Choose one of 6+ | `Select` |
| A setting / an agreement | `Switch` / `Checkbox` |
| Filter by category | `CategoryTabs` |
| Filter the fabric store | `FabricFilterGroups` + `ActiveFilters` |
| Buying fabric for a garment | `GarmentThumb` before the garment field, metres in the panel meta, `FabricChoices` chips (its recommended fabrics, all or one) |
| Group things | `Panel` (glass), rows in `PanelRow`, plain white blocks in `Inset` |
| Label–value details | `DetailList` |
| Any products, on a page or in a section | One `ProductGrid` around a `tiles` grid, with a stroke between products |
| One large product photo | `ProductFrame` around `GarmentImage` |
| A garment in a grid | `GarmentCard` in a `ProductGrid` |
| A fabric in a grid | `FabricCard` in a `ProductGrid` |
| Featured product at the start of a grid | `GarmentCard lead description={…}` |
| Light / dark / system | `useTheme()` from `next-themes`; the switch lives in Profile |
| Started projects | `ProjectGrid` (cards: `ProjectCard`, data: `projectCardData()`) |
| A pattern maker | `MakerCard`; their page starts with `ProfileHeader` |
| A label on a photo | `PhotoLabel` |
| A small white label | `Pill` |
| Pick a size | `SizePicker`, or `SizeSheet` for a project |
| Streaks and stats | `SewingDashboard` |
| Side panel | `PanelSheet` |
| The fabric bag | `FabricBagButton` + `FabricBagSheet` |
| State (saved, failed, needs a look, info) | `StatusMessage`; `StatusBadge` for short labels |
| Quick confirmation | `toast()` from `sonner` |
| Nothing here yet | `Empty` with one next action |
| Loading | `Skeleton`, or `Spinner` in the button |
| A table | `Table` inside an `Inset` |
| A legal page | `LegalPage` + `LegalSection`; `LegalFooter` on every screen |
| Keep the page from jumping when a list shrinks | `KeepHeight` |

## 9. Product rules (sewing)

- **Viewing a step ≠ completing a step.** Progress changes only when the user presses "Mark done". Opening, scrolling to or moving past a step never changes it. The step on screen has `aria-current="step"`.
- Anything that resets progress (like changing size) needs a confirmation that says what will be lost.
- The recommended size is labelled, never chosen silently.
- Measurements show their unit in the field and use `inputMode="decimal"`.
- No fake social proof: example profiles are labelled "Example profile", no invented reviews or counts.

## 10. Icons

- Tabler only, stroke style. Colour inherits.
- In buttons, menus and inputs, don't set a size. Inline `size-4`, rows `size-5`, empty states `size-8`.
- Decorative icons get `aria-hidden`. Same meaning, same icon everywhere. No emoji.

## 11. Motion

One easing everywhere: `[0.22, 1, 0.36, 1]` (`ease` in `reveal.tsx`, `--ease-out-soft` in CSS).

| What | How |
| --- | --- |
| Signature: titles wipe up from a mask | Built into `PageHeader` and `HeroBand` (`MaskedLine`) |
| Page-load cascade | `Rise index={n}`: kicker, then lines, then copy and actions, 100ms apart |
| Sections rise in | Automatic for children of `PageContainer` (headers run their own reveal) |
| Grids stagger in | `tile-grid` on the grid; key it by the active filter so it replays |
| Atmosphere | `Atmosphere`: one soft, still light in the top corner. Nothing drifts |
| Gentle parallax | `HeroBand` only: the headline drifts up 48px over the first screen |
| Sliding marker (tabs, navigation) | Built into `CategoryTabs`, `AppSidebar`, `AppTabBar` |
| Progress draws in | Automatic on `Progress` |
| Hover | Buttons lift 1px; glass tiles frost in (`glass-inset-hover`), never swap colour; `hover-zoom` on photos |

No bounce. Animate after hydration (`useRevealReady`). Reduced motion is respected everywhere (`MotionConfig reducedMotion="user"` plus the global CSS rule).

## 12. Imagery

`GarmentImage` shows the garment photo from `lib/garment-photos.ts` (files in `public/garments`). The garment is the subject of the picture. A photo attached to a garment shows everywhere that garment appears, so always pass `garment.photo`. With no photo, or one that won't load, it shows a plain no-photo icon, never a drawn stand-in. Fabric photos belong to the shops.

## 13. Accessibility (WCAG 2.2 AA)

- Text ≥ 4.5:1, UI parts ≥ 3:1. The tokens pass; raw colours might not.
- Everything works by keyboard. Focus is a 2px ink outline, always visible (built in).
- Every input has a visible label. Errors are text under the field plus `aria-invalid`.
- Icon-only buttons have `aria-label`. Photos have `alt`; decorative images `alt=""`.
- Charts have the same data as text for screen readers.
- One `h1` per screen; headings in order.

## 14. Voice

Sigrid sounds like a calm, experienced friend at the sewing table. Every sentence should leave a nervous first-time sewer calmer and clearer.

- Calm, not cheerful: no exclamation marks, no hype, no emoji.
- One thing at a time: short sentences, one action each, numbers with units ("Sew 1.5 cm from the edge").
- Honest about progress, data and money ("Nothing changes without telling you first").
- Body-neutral: sizes and measurements, never "flattering".
- Buttons: a verb first, 1–3 words, saying the result ("Start sewing", "Agree and continue").
- No step numbers like "01" or percentages where a plain "6/25" or words will do. (Product rule wins over the skill's numbered-index suggestion.)

## 15. Before you call UI work done

- [ ] Built only from components and patterns shown in Storybook (or new ones were added with stories)
- [ ] No raw colours, arbitrary values, emoji icons or extra fonts
- [ ] Glass is real frost over the atmosphere; nothing nested blurs inside glass; nothing blended sits above the page
- [ ] At most one primary button per view
- [ ] Right at 375px and on a laptop, **in light and dark**; keyboard works; Accessibility panel clean
- [ ] Progress only changes on an explicit action
- [ ] Copy is calm, specific and plain
- [ ] The honesty check: does it have a signature moment and varied composition, or does it look like a template?
