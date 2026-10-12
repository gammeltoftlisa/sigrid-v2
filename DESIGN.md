# DESIGN.md: UI rules for Sigrid

These rules are **mandatory** for anyone building UI in this repo, people and AI agents alike.
The visual reference is the Storybook in the `sewing-app` repo (`npm run storybook`, http://localhost:6006), which documents the components in this repo.

Where things live here: tokens and the brand layer in `app/globals.css`, shadcn components in `components/ui/`, patterns in `components/patterns/`, imagery in `components/garment/`.
The sewing guide (`components/sewing/`, `components/legacy/`) is older code that still uses legacy class aliases (`bg-surface`, `text-ink`…); don't use those names or `components/legacy` in new code.

> **Brand: Nordic × Apple.** Near-white and near-black like Totême and Byredo, with Apple's crisp type, soft corners and frosted glass.
> One typeface (Inter). Glass holds things, white is what you read and touch. No strokes, no shadows. Calm, trustworthy, easy to read.

## 0. Workflow

1. **Storybook first.** Before building a screen, look for an existing component or pattern in Storybook.
2. **Missing piece?** Add it as a pattern (or `npx shadcn@latest add <name>` for a shadcn component), then a story for it in the Storybook.
3. **Compose, don't restyle.** Screens are built from `components/ui/*` and `components/patterns/*`. If a page needs a long one-off `className`, it belongs in a pattern.
4. **Check phone and laptop.** Every story must look right at 375px and on a laptop, with no violations in the Accessibility panel. The app is light only.
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
| Font | Inter for everything (`font-sans`, `font-heading`); Geist Mono for code only | Any other font |

Base UI note: triggers compose with `render={<Button … />}`, **not** `asChild`. A `Button` rendered as a link needs `nativeButton={false}`.

## 2. Colour

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#FAF8F4` | The page: plain very light sand, no gradients |
| `glass` (`--glass-tint`) | `#E4DBCE` at 86%, frosted | Everything that holds things: navigation, panels, sheets, menus |
| `card` | `#FFFFFF` | What sits on glass: rows, fields, chips, buttons, tiles, `Inset` |
| `foreground` / `primary` | `#1D1D1F` | Text, the main button, selected states, progress |
| `muted-foreground` / `brand-ink` | `#5A5A5E` | Secondary text and counts (AA on every surface) |
| `muted` / `secondary` | `#ECEAE6` | Photo backdrops, skeletons |
| `data-1` … `data-4` | `#A88F6C` → `#33261B` | Charts: one hue, light to dark (the heatmap, confetti). Each step ≥ 3:1 on white |
| `indicator` | `#8A898C` | Inactive step marks (3.3:1 on the page) |
| `success` / `destructive` / `warning` / `info` | text `#2F6B42` / `#A2382A` / `#7D5508` / `#2F5C8F`, accent (`-solid`) `#4FA06A` / `#E0553F` / `#E2A132` / `#4F86C6` | State only, always with text or an icon. Use `StatusBadge` and `StatusMessage` |

- Only token utilities: `bg-card`, `bg-glass`, `text-muted-foreground`, `bg-data-2`. Never `bg-white`, `text-black` or hex values.
- **One primary action per screen or dialog.**
- New tokens go in `:root` and the `@theme inline` mapping in the global CSS, and must pass AA.

## 3. Surfaces: glass, white, nothing else

Three steps, nothing else separates things:

| Surface | What | How |
| --- | --- | --- |
| Page | plain `background` | nothing to add |
| Glass | navigation rail and tab bar, panels, sheets, menus, toasts, outline buttons | `Panel`, `glass-panel`, `glass` (floating bars), automatic on sheets, menus and outline buttons |
| White on glass | rows, fields, chips, buttons, tiles, stat blocks | `PanelRow`, `Inset`, `DetailList`; fields and chips turn white inside glass automatically |

- **No strokes and no shadows anywhere**: no borders, dividers, hairlines or drop shadows. The only drawn line is the keyboard focus outline. (The global CSS makes every border transparent and removes every shadow, so `border`, `ring-*` and `shadow-*` classes do nothing; don't add them.)
- Fields and chips on the plain page are filled with the glass tint; on glass they're white.
- Dropdowns open below their field and are solid white.
- Photos and reading text are never glass. Labels on photos use `PhotoLabel` (a small glass pill).
- Glass turns solid when the system asks for reduced transparency.

## 4. Shape

| Token | Value | Use |
| --- | --- | --- |
| `rounded-(--radius)` | 12px | Panels, cards, sheets |
| `rounded-(--control-radius)` | 10px | Fields, buttons, white rows, `Inset` |
| `rounded-(--image-radius)` | 6px | Photos |
| `rounded-pane` / `rounded-pane-lg` / `rounded-pane-inner` | 22 / 28 / 24px | The floating rail, tab bar, action bar and their inner pills |
| `rounded-xs` | 4px | Heatmap cells, tiny marks |
| `rounded-full` | | Avatars, pills, chips on photos |

Image shapes: `aspect-product` (4:5, product tiles), `aspect-cover` (4:3, project cards), `aspect-wide` (2:1, maker covers).

## 5. Type and spacing (the rhythm)

One type scale and one spacing scale. Tailwind's size names are remapped so every class lands on the scale.

| Type | Size | Use |
| --- | --- | --- |
| `eyebrow` / `text-2xs` | 12px, uppercase for eyebrows | Panel labels, shop names, counts |
| `text-xs` | 13px | Details, meta, captions, field labels |
| `text-sm` | 15px | Body, lists (the default UI size) |
| `text-base` | 17px | Lead text under a title, reading text |
| `text-xl` | 22px | Section titles (`PageSection`, `LegalSection`) |
| `h1` | 34px on phones, 44px from `md`, weight 600 | The page title, one per screen |

Headings are weight 600 with tight tracking; body is 400, emphasis 500. `tabular-nums` on measurements, counts and prices. Reading text is `max-w-prose`.

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
| Fields and dropdowns | 36px (44px on touch) | 14px text, 12px side padding, 10px corners, 16px muted icons |
| Button | 40px | `size="lg"` (44px) for the one main action |
| Small button and chips | 32px (40px on touch) | `size="sm"`; filter chips, removable filters, the bag |
| Icon button | 36–44px | `size="icon-lg"` in bars, always with `aria-label` |

- Chips are white on glass and ink when chosen.
- Labels: 13px medium, 8px above the field. Every field has a visible label; placeholders are examples.
- While you type, a field turns white with an ink outline and a faint ring.
- The slider is a 2px track with small white handles; it can always be typed into as well.
- Touch targets are at least 44×44px on phones.

## 7. Layout

- **Mobile first** (375px). Screens use `PageContainer` and `PageHeader` inside `AppShell`.
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
| Main / secondary / quiet action | `Button` / `variant="outline"` / `variant="ghost"` |
| Delete or reset | `Button variant="destructive"` (outlined text) + `AlertDialog` that says what will be lost |
| Icon-only action | `Button size="icon-lg"` + `aria-label` |
| Text input | `Field` > `FieldLabel` + `Input` |
| Choose one of 6+ | `Select` |
| A setting / an agreement | `Switch` / `Checkbox` |
| Filter by category | `CategoryTabs` |
| Filter the fabric store | `FabricFilterGroups` + `ActiveFilters` |
| Group things | `Panel` (glass), rows in `PanelRow`, plain white blocks in `Inset` |
| Label–value details | `DetailList` |
| A garment in a grid | `GarmentCard` |
| A fabric in a grid | `FabricCard` |
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

| What | How |
| --- | --- |
| Sections rise in | Automatic for children of `PageContainer` |
| Grids stagger in | `tile-grid` on the grid; key it by the active filter so it replays |
| Sliding marker (tabs, navigation) | Built into `CategoryTabs`, `AppSidebar`, `AppTabBar` |
| Progress draws in | Automatic on `Progress` |
| Photo zoom on hover | `hover-zoom` on the image, triggered by the card's `group` |
| Press feedback | `press` (scales to 97%) |

Easing `--ease-out-soft`. No bounce, loops or parallax. Reduced motion is respected everywhere.

## 12. Imagery

`GarmentImage` shows the garment photo from `lib/garment-photos.ts` (free Unsplash photos, credited on the company page). The garment is the subject: plain backdrops, cropped to the garment, no faces (`focus` crops past them). Without a photo it falls back to `GarmentArt`. Fabric photos belong to the shops.

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
- No step numbers like "01" or percentages where a plain "6/25" or words will do.

## 15. Before you call UI work done

- [ ] Built only from components and patterns shown in Storybook (or new ones were added with stories)
- [ ] No raw colours, arbitrary values, strokes, shadows, emoji icons or extra fonts
- [ ] Glass holds things, white is what you read and touch
- [ ] At most one primary button per view
- [ ] Right at 375px and on a laptop; keyboard works; Accessibility panel clean
- [ ] Progress only changes on an explicit action
- [ ] Copy is calm, specific and plain
