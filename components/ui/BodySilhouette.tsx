'use client'

import { motion } from 'framer-motion'

type MeasurementField = 'bust' | 'waist' | 'hips' | 'height' | 'inseam'

interface Props {
  activeField?: MeasurementField | null
  measurements?: Partial<Record<MeasurementField, number>>
  className?: string
}

const regionPaths: Record<MeasurementField, string> = {
  bust: 'M48 68 Q60 62 72 68 L74 86 Q60 90 46 86 Z',
  waist: 'M50 90 Q60 86 70 90 L71 104 Q60 108 49 104 Z',
  hips: 'M46 108 Q60 103 74 108 L76 128 Q60 133 44 128 Z',
  height: 'M57 30 L57 175',
  inseam: 'M46 148 L52 175 M74 148 L68 175',
}

export default function BodySilhouette({ activeField, measurements, className = '' }: Props) {
  const isActive = (field: MeasurementField) => activeField === field
  const hasValue = (field: MeasurementField) => measurements?.[field] !== undefined

  const baseColor = 'var(--sig-border)'
  const activeColor = 'var(--sig-primary)'
  const filledColor = 'var(--sig-success)'

  const getColor = (field: MeasurementField) => {
    if (isActive(field)) return activeColor
    if (hasValue(field)) return filledColor
    return baseColor
  }

  return (
    <svg
      viewBox="0 0 120 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Body outline */}
      {/* Head */}
      <circle cx="60" cy="22" r="15" fill="var(--sig-surface-2)" stroke={baseColor} strokeWidth="2" />
      {/* Neck */}
      <rect x="55" y="35" width="10" height="12" fill="var(--sig-surface-2)" />
      {/* Shoulders + arms */}
      <path
        d="M30 55 L26 100 L36 102 L40 70"
        stroke={baseColor}
        strokeWidth="2"
        fill="var(--sig-surface-2)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M90 55 L94 100 L84 102 L80 70"
        stroke={baseColor}
        strokeWidth="2"
        fill="var(--sig-surface-2)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Torso */}
      <path
        d="M40 47 Q60 42 80 47 L82 130 Q60 136 38 130 Z"
        fill="var(--sig-surface-2)"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Legs */}
      <path
        d="M44 130 L38 175 L50 175 L54 148 M76 130 L82 175 L70 175 L66 148"
        fill="var(--sig-surface-2)"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crotch */}
      <path
        d="M44 148 Q60 152 76 148"
        stroke={baseColor}
        strokeWidth="2"
        fill="none"
      />

      {/* Bust region */}
      <motion.path
        d={regionPaths.bust}
        fill={getColor('bust')}
        fillOpacity={isActive('bust') ? 0.25 : hasValue('bust') ? 0.2 : 0}
        stroke={getColor('bust')}
        strokeWidth={isActive('bust') ? 2.5 : 1.5}
        strokeOpacity={isActive('bust') || hasValue('bust') ? 1 : 0}
        animate={{ fillOpacity: isActive('bust') ? 0.25 : hasValue('bust') ? 0.2 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Waist region */}
      <motion.path
        d={regionPaths.waist}
        fill={getColor('waist')}
        fillOpacity={isActive('waist') ? 0.25 : hasValue('waist') ? 0.2 : 0}
        stroke={getColor('waist')}
        strokeWidth={isActive('waist') ? 2.5 : 1.5}
        strokeOpacity={isActive('waist') || hasValue('waist') ? 1 : 0}
        animate={{ fillOpacity: isActive('waist') ? 0.25 : hasValue('waist') ? 0.2 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Hips region */}
      <motion.path
        d={regionPaths.hips}
        fill={getColor('hips')}
        fillOpacity={isActive('hips') ? 0.25 : hasValue('hips') ? 0.2 : 0}
        stroke={getColor('hips')}
        strokeWidth={isActive('hips') ? 2.5 : 1.5}
        strokeOpacity={isActive('hips') || hasValue('hips') ? 1 : 0}
        animate={{ fillOpacity: isActive('hips') ? 0.25 : hasValue('hips') ? 0.2 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Height line */}
      <motion.line
        x1="55"
        y1="8"
        x2="55"
        y2="178"
        stroke={getColor('height')}
        strokeWidth={isActive('height') ? 2.5 : 1.5}
        strokeOpacity={isActive('height') || hasValue('height') ? 1 : 0}
        strokeDasharray="4 3"
        animate={{ strokeOpacity: isActive('height') || hasValue('height') ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Inseam line */}
      <motion.path
        d="M54 148 L50 175 M66 148 L70 175"
        stroke={getColor('inseam')}
        strokeWidth={isActive('inseam') ? 2.5 : 1.5}
        strokeOpacity={isActive('inseam') || hasValue('inseam') ? 1 : 0}
        strokeLinecap="round"
        animate={{ strokeOpacity: isActive('inseam') || hasValue('inseam') ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Active indicator dots */}
      {isActive('bust') && (
        <motion.circle
          cx="60"
          cy="77"
          r="4"
          fill={activeColor}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.3 }}
        />
      )}
      {isActive('waist') && (
        <motion.circle
          cx="60"
          cy="97"
          r="4"
          fill={activeColor}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.3 }}
        />
      )}
      {isActive('hips') && (
        <motion.circle
          cx="60"
          cy="118"
          r="4"
          fill={activeColor}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.3 }}
        />
      )}
    </svg>
  )
}
