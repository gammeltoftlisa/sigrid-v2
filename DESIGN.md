# DESIGN.md: UI rules for Sigrid

These rules are **mandatory** for anyone building UI in this repo, people and AI agents alike.
The visual reference is the Storybook in the `sewing-app` repo (`npm run storybook`, http://localhost:6006), which documents the components in this repo. Its Screens are this app's real pages, copied by the sync script.

Where things live here: tokens and the brand layer in `app/globals.css`, shadcn components in `components/ui/`, patterns in `components/patterns/`, imagery in `components/garment/`.
The sewing guide (`components/sewing/`, `components/legacy/`) is older code; don't use `components/legacy` in new code.

> **Logo: a needle bent into an S.** `NeedleMark` on its own in the rail and browser icon, `Wordmark` (the needle as the S of Sigrid) elsewhere. It takes the text colour, so it works in both themes.
>
> **Brand: liquid glass, warm editorial atelier.** Built on the `liquid-glass-frontend` skill (`.claude/skills/liquid-glass-frontend`, read its `references/` before UI work).
> Real Apple-style frosted glass over a calm page: a cutting mat as the floor, seen from low down looking towards the top right, on a stipple of tiny dots (`Atmosphere`), in black, white and beige. A characterful serif (Fraunces) does the talking, with italic accents and small mono kickers.
> **Signature moment:** the big Fraunces page title with its italic ink line. Calm copy, confident type. Nothing animates on arrival.

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
| `--glass-fill` / `-inset` / `-solid` / `-bar` / `-menu` | `--glass-fill` white at 20% (5% on dark), `-inset` transparent, `-solid` / `-bar` / `-menu` white at 80 / 78 / 90% (near-black on dark) | Every glass surface |
| `--app-elev` | `#FFFFFF` / `#2B2B2B` | Solid fills, such as a focused field |
| `card` → `--glass-inset` | see above | Insets: what sits on glass |
| `--app-text` → `foreground` | `#211C16` / `#F0ECE1` | Text |
| `--app-text-soft` → `muted-foreground` | `#6B6052` / `#A79C8C` | Secondary text (AA on every surface) |
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

**Products and reading have their own container.** A product (photo plus text) always sits in `ProductGrid`: a solid fill a little lighter than the page (`--product-fill`) with the page's dots. A page shares one container for all its products, with a stroke between them instead of a box around each. The same goes for products in a labelled section (`ProductGrid label="…"`). Never put products directly on the background or in a glass `Panel`. A single large photo uses `ProductFrame`.

**Glass is only for things you act on:** buttons, button groups, fields, the rail and tab bar, menus, dialogs, and panels of controls (`<Panel glass>`, such as Browse in Find fabric, the guide's step list and Profile's `SettingsList`). Products and anything you only read use the solid container: `ProductGrid`, or `Panel` without `glass`, such as dashboard stats and step instructions.

Glass is **one material, whatever its size**: white and see-through, a white tint (`--glass-fill`) + `--glass-blur` + a 1px top edge. `--glass-blur` drains the colour, maps the page to near white and raises the difference between the page and the mat's lines, so they show softly blurred through it. Tune brightness and contrast together: if the page lands below near white, glass turns gray. A panel, a secondary button and a button group look the same. Whatever sits inside glass adds no fill of its own (`--glass-inset`), so it looks the same there as on the page. Only the page is warm: no cream tints on glass and no `saturate()`, which turns the warm page yellow. Only surfaces that text scrolls under are thicker: fixed bars, sheets and dialogs, menus. `Atmosphere` (in the root layout) draws the mat and a stipple of tiny dots behind every screen. No drifting blobs, no moving fades.

| Material | What | How |
| --- | --- | --- |
| Surface | panels, cards, alerts, the segmented control | `Panel`, `glass-panel`, `glass-surface`; automatic on `Card` and `Alert` |
| Soft | floating bars: rail, tab bar, `ActionBar`; sheets and dialogs. Bars fixed over scrolling content are thicker (`--glass-fill-bar`) so labels stay readable | `glass` / `glass-surface-soft`; automatic on sheets and dialogs |
| Menu (~82% solid) | dropdowns, popovers, tooltips, toasts | automatic; `glass-menu` for custom popovers |
| Inset (no blur) | everything **inside** glass: rows, fields, chips, buttons, tiles | `PanelRow`, `Inset`, `DetailList`; fields and buttons turn inset automatically |
| Glass pill | primary and outline buttons on the page | automatic on `Button` |

- **Never animate `opacity`, `filter` or `mask` on glass or on anything that contains it, even with a fill-forwards animation that has ended.** The browser then cuts the glass off from the page: its computed styles look right, but there is nothing behind it to blur.
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

| Level | Class | Look | Use |
| --- | --- | --- | --- |
| Page title | `h1` | `clamp(2.75rem, 6.2vw, 5.75rem)`, Fraunces 360 | One per screen |
| Compact page title | `h1.title-compact` | `clamp(2.25rem, 3.4vw, 3.5rem)`, Fraunces 360 | The title shares the screen: garment, maker, a message page |
| Section | `page-section-title` | 26–36px Fraunces 400 | Sections of a page (`PageSection`) |
| Big moment | `title-xl` | 34px Fraunces 400 | A celebration, a stat |
| Main subject | `title-lg` | 28px Fraunces 400 | The one thing a panel is about: the current step, a plan's price |
| Subject | `title-md` | 22px Fraunces 400 | What a block is about: a project, a maker, a legal section, a garment's price |
| Small subject | `title-sm` | 19px Fraunces 400 | Product names, dialog and empty-state titles (automatic on those) |
| Lead | `text-base` | 17px, 400 | Under a title, reading text |
| Body | `text-sm` | 15px, 400 | Default text, buttons (500), fields, menus, breadcrumbs |
| Detail | `text-xs` | 13px, 400 | Meta, captions, small buttons and chips (500) |
| Tiny mark | `text-2xs` | 12px, 500 or 400 | Counters, step numbers, tab bar labels |
| Label | `eyebrow`, `kicker` | 11px mono 500, 0.22em, uppercase | Panel labels, badges, every small uppercase label |

Text is 400, or 500 for emphasis. **Never 600 or 700, and never a size that isn't in this table.** Don't reach for `text-xl` or `font-heading` directly: use the level.

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
| Fields and dropdowns | 36px (44px on touch) | 15px text, 12px side padding, 14px corners, 16px muted icons |
| Button | 40px | `size="lg"` (44px) for the one main action |
| Small button and chips | 32px (40px on touch) | `size="sm"`; filter chips, removable filters, the bag |
| Icon button | 36–44px | `size="icon-lg"` in bars, always with `aria-label` |

- Chips and size tiles are frosted, ink when chosen.
- Labels: 13px medium, 8px above the field. Every field has a visible label; placeholders are examples.
- While you type, a field turns solid with a ink edge and a soft ink ring.
- The slider is a 2px ink track with small glass handles; it can always be typed into as well.
- Touch targets are at least 44×44px on phones.

## 7. Layout

- **Mobile first** (375px). Screens use `PageContainer` and `PageHeader` inside `AppShell`.
- **Vary the treatment.** Siblings don't all share one shape: a product grid leads with a `GarmentCard lead` (twice as wide and tall, with its description), and adjacent sections use different patterns.
- **Navigation**: from `md`, a floating glass icon rail (`AppSidebar`); on phones, a floating glass tab bar (`AppTabBar`). Pages leave room with `pb-tabbar`. The phone's main action goes in an `ActionBar` above the tab bar.
- **12-column grid**: one grid, one gutter (16px on phones, 24px from `md`). Never one-off `grid-cols-[…]`.
  - `grid-12` is the page grid. `col-side` (4 columns on `lg`, 3 from `xl`, sticky 8px from the top like the rail) and `col-main` (the rest) make the two-column workspace.
  - `tiles` is the product grid: 2 per row on phones, 3 on tablets, 4 on laptops; 5 when full width from `xl`, 4 beside a side panel. Use `tiles-compact` for tighter rows (project cards).
  - `tiles-wide` is for bigger cards: 1, then 2, then 3 per row.
- **Top line**: `PageHeader` (or `TopBar`) shows back, breadcrumbs and quick actions as plain text on the page, no container.
- **Side sheets**: `PanelSheet` (full width on phones, 448px from `sm`).
- **Show only what's needed.** Fewer panels, fewer words, one main action.

## 8. Which component to use

| Need | Use |
| --- | --- |
| A page title | `PageHeader` (optional `kicker`) |
| Main / secondary / quiet action | `Button` (black, stitched) / `variant="outline"` (frosted pill) / `variant="ghost"` |
| Delete or reset | `Button variant="destructive"` (outlined text) + `AlertDialog` that says what will be lost |
| Icon-only action | `Button size="icon-lg"` + `aria-label` |
| Text input | `Field` > `FieldLabel` + `Input` |
| Choose one of 6+ | `Select` |
| A setting / an agreement | `Switch` / `Checkbox` |
| Filter by category | `CategoryTabs` |
| Filter the fabric store | `FabricFilterGroups` + `ActiveFilters` |
| Buying fabric for a garment | `GarmentThumb` before the garment field, metres in the panel meta, `FabricChoices` chips (its recommended fabrics, all or one) |
| Group things | `Panel` (solid; `glass` when it holds controls), rows in `PanelRow`, plain white blocks in `Inset` |
| Label–value details | `DetailList` |
| Any products, on a page or in a section | One `ProductGrid` around a `tiles` grid, with a stroke between products |
| One large product photo | `ProductFrame` around `GarmentImage` |
| A garment in a grid | `GarmentCard` in a `ProductGrid` |
| A fabric in a grid | `FabricCard` in a `ProductGrid` |
| Featured product at the start of a grid | `GarmentCard lead description={…}` |
| Light / dark / system | `useTheme()` from `next-themes`; the switch lives in Profile |
| The project to pick up on Home | `HomeDashboard` |
| The user's picture and setting it | `UserAvatar`, `ProfilePhoto` (drop, paste or choose, then frame) |
| Started projects | `ProjectGrid` (cards: `ProjectCard`, data: `projectCardData()`) |
| A pattern maker | `MakerCard`; their page starts with `ProfileHeader` |
| A label on a photo | `PhotoLabel` |
| A small white label | `Pill` |
| Pick a size | `SizePicker`, or `SizeSheet` for a project |
| This week and totals on Home | `SewingDashboard` |
| A settings page | `SettingsList` > `SettingsGroup` > `SettingsRow` |
| Side panel | `PanelSheet` |
| The fabric bag | `FabricBagButton` + `FabricBagSheet` |
| State (saved, failed, needs a look, info) | `StatusMessage`; `StatusBadge` for short labels |
| Quick confirmation | `toast()` from `sonner` |
| Nothing here yet | `Empty` with one next action |
| Loading | `Skeleton`, or `Spinner` in the button |
| A table | `Table` inside an `Inset` |
| Login and sign-up | `AuthShell` around Clerk's form; its styling is in the global CSS |
| A legal page | `LegalPage` + `LegalSection`, with `LegalFooter` under it. Always a page, never a modal: long reading that has to be linkable, printable and open to anyone |
| Reaching the legal pages | `SettingsLinks` in Profile, plus a link where it matters: sign-up, the welcome's agreement, before paying. Those open in a new tab so nothing being filled in is lost. Not in a footer on every screen |
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

One easing everywhere: `[0.22, 1, 0.36, 1]` (`ease` in `patterns/reveal.tsx`, `--ease-out-soft` in CSS).

| What | How |
| --- | --- |
| Atmosphere | `Atmosphere`: a cutting mat and tiny dots behind every screen. Nothing moves |
| Guide steps | See "Guide animations" |
| Sliding marker (tabs, navigation) | Built into `CategoryTabs`, `AppSidebar`, `AppTabBar` |
| Hover | Buttons lift 1px; glass tiles frost in (`glass-inset-hover`), never swap colour; `hover-zoom` on photos |

No bounce. Reduced motion is respected everywhere (`MotionConfig reducedMotion="user"` plus the global CSS rule).

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

## Guide animations

Every guide step plays as a short film: **what you do, the whole way along, then the result.** Nobody chooses an animation. `lib/guide-animation/rules.ts` reads it from the step, so this works for every guide and for patterns from the studio. Change a rule there and in this table together.

| The step says | It plays |
| --- | --- |
| `prepare`, "wash" | The cloth lifts and settles |
| `prepare`, "fold" or "lay out" | The cloth folds in half |
| `prepare`, "hang", or with a piece | The work settles flat |
| `cut`, the piece on the fold, or "on the fold" | **Half pattern.** Fold, pattern against the fold, draw round it, cut everywhere except the fold, opens into one joined piece |
| `cut`, "(cut 2)", "both layers", "a left and a right", more than one of a piece | **Two loose pieces.** Fold, pattern in the corner away from the fold, cut right round, A1 and A2 lie apart |
| `cut`, anything else | **Full pattern.** One layer, pattern in a corner, one piece |
| `mark` right before a `cut` of the same piece | The first half of the cut: the chalk line. The `cut` step then cuts it |
| `mark`, anything else | Chalk marks along the edge, as many as it says ("4 loops") |
| `fold`, "0.5 + 1 cm", "6 mm double fold" | **Fold twice**, each the whole length |
| `fold`, "2.5 cm fold" or `annotation.amount` | **Fold once**, the whole length |
| `fold`, "in half" | Fold once, half the piece |
| `press`, "fold" or "hem" in the title | The same as `fold`, then ironed |
| `press`, anything else | The iron, once, along the whole seam or edge |
| `pin` | Pins evenly along the whole line, one after another |
| `sew` or `attach` | The machine along the whole line. If the edge is folded it sews the fold's inner edge |
| `sew`, "by hand", "slip stitch" | The hand needle instead of the machine |
| `sew`, "buttons" | Each button, by hand, as many as it says |
| `sew`, "dart" | A short dart in from the edge |
| A piece in `pieceIds` not yet on the table | It comes in first, then the step's own action |
| Any step after it | Whatever was folded and sewn stays on the cloth |

**Stitches:** straight by default. "baste", "longest stitch", "gather": basting. "topstitch", "close to the fold", "understitch": topstitch. "zigzag", "overlock", "blind hem", "buttonhole" (satin): those stitches.

**Which edge:** `annotation.edge`; "hem" means the bottom; "front edges" or "placket" means both sides.

**Rules for every animation**

- One fabric colour on both sides and for every piece. No textures.
- A tool is always the same size on screen, whatever the camera does. Stitches are thin and small.
- The camera follows the work from start to end and pulls back for the result. Never a partial close-up that suggests working only there.
- Pieces are always named the same way: A, or A1 and A2.
- Cut pieces come from a corner, to save fabric. The pattern sits exactly in the corner: a side on the fabric's own edge is never drawn or cut.
- Folds are one even movement. Check landings by measuring frame-to-frame change: a jump is a bug.

**To make a guide look right:** write the step in plain words, set `action`, and give an edge with `annotation` when it matters. Set `pieceIds` and `join` when a step joins pieces: `layer` lays one on another (a shoulder, a side seam on a flat garment), `side` puts it beside (a sleeve), `top` on its top edge (a collar, a band).

## Site structure

Each main page answers one question. **Home:** what am I sewing and how is it going (no browsing). **My patterns:** every pattern I've bought, kept for good, whether I've started it or finished it. **Explore:** what could I sew next (every pattern and maker). **Shop:** what do I sew it with: fabric and every other supply. Each pattern page has a "What you'll need" list (`lib/fabric/supplies.ts`, only what its guide or description says), and each row opens that supply in the shop for that pattern. **Profile:** my account and settings. **Everything needs an account:** `proxy.ts` sends anyone logged out to the login screen, and only login and the legal pages are open. A *pattern* is what you find and buy, a *project* is what you're sewing. Main pages have no breadcrumbs, because the menu shows where you are; deeper pages do.

**No entrance animations.** Pages and their content are simply there when you arrive: no rising, fading, wiping or staggering. Motion only answers something you do, like a hover, a press or opening a panel.
