export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type FitType = 'Oversized' | 'Relaxed' | 'Regular' | 'Fitted' | 'Tailored'
export type GarmentCategory = 'Tops' | 'Bottoms' | 'Dresses' | 'Outerwear'

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
  description: string
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
