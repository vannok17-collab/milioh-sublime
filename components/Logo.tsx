'use client'

import { useState } from 'react'

// Place the real Miliöh Sublime logo at /public/logo.png (remplace ce fichier
// quand le logo définitif sera fourni). En attendant, on retombe sur l'icône
// livrée dans le projet pour ne jamais dépendre d'une image hébergée en ligne.
export function Logo({ compact = false }: { compact?: boolean }) {
  const [src, setSrc] = useState('/logo.png')
  return (
    <img
      src={src}
      onError={() => setSrc('/icon.svg')}
      alt="Miliöh Sublime"
      className={compact ? 'h-10 w-16 object-cover object-center rounded-lg' : 'h-24 w-36 object-cover object-center rounded-2xl'}
    />
  )
}
