interface Props {
  name: string
  className?: string
  color?: string
}

export default function GarmentIllustration({ name, className = '', color = 'var(--sig-primary)' }: Props) {
  const lower = name.toLowerCase()

  if (lower.includes('t-shirt') || lower.includes('tshirt') || lower.includes('top') || lower.includes('blouse') || lower.includes('linen set')) {
    return (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
          d="M30 28 L20 50 L38 52 L38 95 L82 95 L82 52 L100 50 L90 28 L74 36 Q60 42 46 36 Z"
          fill={color}
          fillOpacity="0.15"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M46 36 Q60 30 74 36"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    )
  }

  if (lower.includes('skirt') || lower.includes('culotte')) {
    return (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
          d="M38 30 L82 30 L95 95 L25 95 Z"
          fill={color}
          fillOpacity="0.15"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1="35" y1="40" x2="85" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (lower.includes('trouser') || lower.includes('pant') || lower.includes('cargo')) {
    return (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
          d="M32 25 L88 25 L88 55 L70 55 L65 95 L55 95 L50 55 L32 55 Z"
          fill={color}
          fillOpacity="0.15"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1="60" y1="55" x2="60" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (lower.includes('hoodie')) {
    return (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
          d="M28 30 L18 55 L36 57 L36 98 L84 98 L84 57 L102 55 L92 30 L76 38 Q60 26 44 38 Z"
          fill={color}
          fillOpacity="0.15"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M44 38 Q52 50 60 50 Q68 50 76 38"
          stroke={color}
          strokeWidth="2.5"
          fill={color}
          fillOpacity="0.1"
        />
        <path d="M46 98 L46 78 L74 78 L74 98" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  }

  if (lower.includes('dress') || lower.includes('slip') || lower.includes('wrap')) {
    return (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
          d="M45 20 Q60 16 75 20 L82 38 L92 95 L28 95 L38 38 Z"
          fill={color}
          fillOpacity="0.15"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M45 20 L42 32 M75 20 L78 32"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (lower.includes('blazer') || lower.includes('coat') || lower.includes('outerwear')) {
    return (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
          d="M25 28 L15 55 L33 57 L33 98 L87 98 L87 57 L105 55 L95 28 L78 38 L66 30 L54 30 L42 38 Z"
          fill={color}
          fillOpacity="0.15"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M54 30 L58 55 M66 30 L62 55"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M58 55 Q60 57 62 55"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="30" y="30" width="60" height="60" rx="8" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2.5" />
    </svg>
  )
}
