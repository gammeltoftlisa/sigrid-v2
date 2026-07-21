# SIGRID – BUILD PLAN

## Setup & Foundation
- [x] Install dependencies (framer-motion, three, @types/three)
- [x] Create CONCEPT.md
- [x] Update globals.css with design system (CSS variables, typography, spacing)
- [x] Update root layout.tsx (metadata, fonts)
- [x] Create lib/types.ts (TypeScript types)
- [x] Create lib/data.ts (mock content)

## Reusable Components
- [x] PrimaryButton
- [x] SecondaryButton
- [x] GarmentCard
- [x] GarmentIllustration (SVG per garment type)
- [x] CreatorCard
- [x] PatternCard
- [x] DifficultyBadge
- [x] FitBadge
- [x] ProgressBar
- [x] BottomSheet
- [x] TabBar
- [x] BodySilhouette with highlightable regions
- [x] StepInstruction (inline in guide page)

## Onboarding (5 screens)
- [x] Screen 1 – "Anyone can sew" (illustration, headline, progress dots, next)
- [x] Screen 2 – "Made for your body" (illustration, headline, next)
- [x] Screen 3 – "We guide every stitch" (illustration, guide preview, next)
- [x] Screen 4 – Create account (social login, email/password form)
- [x] Screen 5 – Your measurements (body silhouette, skippable)
- [x] Wire all 5 screens into sequential flow at /onboarding

## Dashboard
- [x] Active state (returning user – active project, garment library, creator scroll)
- [x] Category filter bar
- [x] Route: app/(main)/home/page.tsx

## Garment Library
- [x] Full-screen grid with category filter bar
- [x] GarmentCard with illustration, name, badge, time, price
- [x] Embedded in Dashboard and as filter view

## Garment Detail Page
- [x] Large illustration, name, badge, time, description
- [x] Creator section (avatar, name, followers, follow button, certified badge)
- [x] Sigrid base garments: fit selector (slider with live illustration update)
- [x] What's included section
- [x] Price + "Start this project" sticky CTA
- [x] Route: app/garment/[id]/page.tsx

## Fit Selector
- [x] Horizontal slider (Relaxed → Tailored) with click-to-select
- [x] Live illustration color changes with fit
- [x] Integrated into garment detail

## Measurement Confirmation
- [x] Body silhouette with saved measurements shown in green
- [x] Edit mode (tap to switch to input fields)
- [x] Confirm button + skip option
- [x] Route: app/garment/[id]/measurements/page.tsx

## Pattern Result Page
- [x] "Your pattern is ready." headline with success icon
- [x] 4 pattern pieces (A, B, C, D) with coloured dashed outlines
- [x] Dimensions per piece, quantity badge
- [x] Printing guide steps
- [x] Download PDF button
- [x] "Continue to materials" sticky CTA
- [x] Route: app/garment/[id]/pattern/page.tsx

## Material Guide Page
- [x] "What you'll need." headline
- [x] Recommended fabric cards (selectable, difficulty badge)
- [x] Eco-friendly alternatives section
- [x] Secondhand tips
- [x] Shop category list + map placeholder
- [x] "I have my materials" sticky CTA
- [x] Route: app/garment/[id]/materials/page.tsx

## Animated 3D Sewing Guide (most important)
- [x] Three.js scene with mannequin (head, neck, torso, stand)
- [x] T-shirt garment (body cylinder, sleeves, collar, hem, shoulder yoke)
- [x] Soft studio lighting + ground shadow
- [x] Step-based camera animation (smooth lerp, 0.05 speed)
- [x] Part highlight with emissive glow (caramel primary)
- [x] Dimming of non-highlighted parts (0.35 opacity)
- [x] Bottom sheet with step title, description, measurement badge, stitch badge
- [x] "Mark as complete" button → green pulse then advance
- [x] Step complete overlay animation
- [x] Previous/Next arrow buttons
- [x] Progress bar at top
- [x] 12 T-shirt steps with pre-defined camera positions
- [x] Step 12 auto-rotation celebration
- [x] Route: app/garment/[id]/guide/page.tsx

## Project Completion Screen
- [x] Confetti particle animation
- [x] 3D garment auto-rotating (reuses SewingGuide with isCompleted=true)
- [x] "You made this. 🎉" headline
- [x] Photo upload placeholder
- [x] Star rating (1-5) with hover + label feedback
- [x] Share button
- [x] "Start your next project" CTA
- [x] Route: app/garment/[id]/complete/page.tsx

## My Projects Tab
- [x] Active projects section with progress bar and Continue button
- [x] Completed projects grid with user photo placeholder
- [x] "Start something new" prompt card
- [x] Route: app/(main)/projects/page.tsx

## Explore Tab – Creator Marketplace
- [x] "Discover patterns." header
- [x] Search bar
- [x] Category + difficulty dual filter bars
- [x] Featured creators horizontal scroll (with certified badges)
- [x] Pattern grid (6 patterns)
- [x] Route: app/(main)/explore/page.tsx

## Creator Profile Page
- [x] Avatar (initial + color), name, bio, certified badge
- [x] Follower count, pattern count, total makes stats
- [x] Follow/Following toggle button
- [x] Pattern grid
- [x] Route: app/creator/[id]/page.tsx

## Profile Tab
- [x] User avatar + name + email
- [x] Measurements section with body silhouette (all highlighted green)
- [x] cm/inches toggle (animated pill)
- [x] Push notifications toggle
- [x] Payment section (links to payment page)
- [x] Creators I follow list
- [x] Sign out button
- [x] Route: app/(main)/profile/page.tsx

## Payment Placeholder Screen
- [x] Two plan cards (Pay per project / Monthly subscription)
- [x] "Coming soon" badges + disabled buttons
- [x] Beta access note at bottom
- [x] Route: app/payment/page.tsx

## Navigation & Routing
- [x] Root page.tsx redirects to /onboarding
- [x] (main) route group layout with TabBar
- [x] All page links connected
- [x] Page transitions with Framer Motion (AnimatePresence)

## Verification
- [x] Dev server runs without errors
- [x] All 16 screens render correctly (verified with Playwright screenshots)
- [x] Navigation flows work end to end
- [x] 3D sewing guide renders with correct highlight and camera animation
- [x] Mobile-first layout (390×844 viewport) verified
