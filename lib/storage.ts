import { supabase, supabaseConfigured, isDemoMode, reportConnectionFailure, reportConnectionSuccess } from './supabase'
import { compressImage, fileToDataUrl } from './image-compress'

const BUCKET = 'images'

/**
 * Compresse l'image puis :
 * - si Supabase est joignable, l'envoie dans le bucket public `images` et
 *   retourne son URL publique (rapide à servir, jamais stockée dans la ligne
 *   produit/diapo elle-même) ;
 * - sinon (mode démo), retourne une data URL compressée en repli local.
 */
export async function uploadImage(file: File, folder: 'produits' | 'diapo'): Promise<string> {
  const compressed = await compressImage(file)

  if (!supabaseConfigured || isDemoMode() || !supabase) {
    return fileToDataUrl(compressed)
  }

  try {
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
    const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
      contentType: 'image/webp',
      upsert: false,
    })
    if (error) throw error
    reportConnectionSuccess()
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  } catch (e: any) {
    reportConnectionFailure(e?.message ? `Envoi de l'image impossible (${e.message}).` : "Envoi de l'image impossible.")
    return fileToDataUrl(compressed)
  }
}
