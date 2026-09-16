'use client'

import { Star } from 'lucide-react'

export function StarRating({ value, onChange, size }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const interactive = Boolean(onChange)
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange?.(n)}
          style={{ cursor: interactive ? 'pointer' : 'default', width: size, height: size }}
        >
          <Star fill={n <= Math.round(value) ? 'currentColor' : 'none'} />
        </span>
      ))}
    </div>
  )
}
