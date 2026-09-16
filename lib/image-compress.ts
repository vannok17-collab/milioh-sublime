import imageCompression from 'browser-image-compression'

// Compresse et redimensionne côté navigateur avant tout envoi — l'app reste
// rapide même avec beaucoup d'articles ou une connexion mobile moyenne,
// puisqu'on ne transporte jamais la photo originale (souvent 3-8 Mo) telle
// quelle.
const OPTIONS = {
  maxSizeMB: 0.35,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.8,
}

export async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, OPTIONS)
  } catch {
    // Si la compression échoue (format non supporté, etc.), on retombe sur
    // le fichier original plutôt que de bloquer l'ajout de l'article.
    return file
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
