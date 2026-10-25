import type { PieceOutline } from './piece-outline'

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type FitType = 'Oversized' | 'Relaxed' | 'Regular' | 'Fitted' | 'Tailored'
export type GarmentCategory = 'Tops' | 'Bottoms' | 'Dresses' | 'Outerwear'
export type StandardSize = 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export interface Garment {
  id: string
  name: string
  category: GarmentCategory
  difficulty: Difficulty
  estimatedTime: string
  price: number
  isCreator: boolean
  creatorId?: string
  fits?: FitType[]
  sizes: StandardSize[]
  description: string
  /** A photo of this exact garment (a published studio pattern's own photo) */
  photo?: string
  /** Published from the pattern studio on this device */
  published?: boolean
}

export interface Creator {
  id: string
  handle: string
  name: string
  bio: string
  followerCount: string
  isCertified: boolean
  patternCount: number
  avatarColor: string
}

export interface Pattern {
  id: string
  garmentId: string
  creatorId: string
  name: string
  price: number
  difficulty: Difficulty
  fit: FitType
  timesMade: number
  category: GarmentCategory
}

export interface Measurements {
  bust?: number
  waist?: number
  hips?: number
  height?: number
  inseam?: number
}

export interface Project {
  id: string
  garmentId: string
  garmentName: string
  difficulty: Difficulty
  status: 'active' | 'completed'
  progressPercent: number
  startedAt: string
  completedAt?: string
  userPhotoColor?: string
}

export interface SewingStep {
  id: number
  title: string
  description: string
  measurement?: string
  stitchType?: string
  highlight: 'front' | 'back' | 'shoulder' | 'side' | 'sleeve' | 'collar' | 'hem' | 'all'
  camera: {
    position: [number, number, number]
    target: [number, number, number]
  }
}

export interface PatternPiece {
  id: string
  label: string
  name: string
  width: number
  height: number
  quantity: number
}

export interface FabricOption {
  name: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Harder'
  quantityMeters: number
  isEco?: boolean
  isSecondhand?: boolean
}

// ── 2D Step-by-step guide ────────────────────────────────────────────────────

export type StepAction =
  | 'prepare'
  | 'cut'
  | 'mark'
  | 'fold'
  | 'pin'
  | 'sew'
  | 'press'
  | 'attach'

export type PieceEdge = 'top' | 'bottom' | 'left' | 'right'
export type FabricSide = 'right' | 'wrong'

export interface UserMeasurements {
  bust: number
  waist: number
  hips: number
  height: number
  inseam: number
}

export interface PieceDims {
  topWidth: number
  bottomWidth: number
  height: number
}

export interface GuidePiece {
  id: string
  label: string
  name?: string
  shape: 'rectangle' | 'trapezoid'
  dims: PieceDims | ((m: UserMeasurements) => PieceDims)
  /** The real outline (curves, fold, neckline), when known; otherwise it's drawn from dims */
  outline?: PieceOutline
  /** Cut from interfacing instead of the main fabric */
  material?: 'fabric' | 'interfacing'
  grainLine?: 'vertical' | 'horizontal'
  seamAllowance?: number
}

export interface StepAnnotation {
  type: 'cut-line' | 'fold-line' | 'sew-line' | 'pin-row' | 'measure-arrow'
  edge?: PieceEdge
  amount?: number
  label?: string
}

export interface SewingStep2D {
  id: number
  group: string
  action: StepAction
  title: string
  instruction: string
  pieceId?: string
  /**
   * Every piece the step is about, when it joins several (the first is also `pieceId`).
   * "<id>#2" is the second cut of a piece that's cut twice (drawn mirrored), e.g. two overlay halves.
   */
  pieceIds?: string[]
  /** How the pieces of a joining step meet: edge to edge at the sides, onto the top edge (a collar), or laid on top */
  join?: JoinKind
  secondPieceId?: string
  fabricSide?: FabricSide
  annotation?: StepAnnotation
  tool?: 'scissors' | 'pins' | 'needle' | 'iron' | 'chalk' | 'ruler'
  measurement?: string
  tip?: string
}

export type JoinKind = 'side' | 'top' | 'layer'

export interface GarmentGuide {
  garmentId: string
  pieces: GuidePiece[]
  steps: SewingStep2D[]
  /** Show the maker's sections exactly (patterns from the studio); built-in guides merge one-step sections */
  keepSections?: boolean
  /** The maker's icon per section title (keys of the studio's section icons) */
  sectionIcons?: Record<string, string>
}
