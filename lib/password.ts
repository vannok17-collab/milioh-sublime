export function checkPasswordStrength(pw: string): { ok: boolean; message: string } {
  if (pw.length < 8) return { ok: false, message: 'Le mot de passe doit contenir au moins 8 caractères.' }
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return { ok: false, message: 'Le mot de passe doit contenir des lettres et des chiffres.' }
  return { ok: true, message: 'Mot de passe valide.' }
}

// Règle renforcée pour l'espace de gestion (comptes avec accès complet au
// stock, aux commandes, aux annulations...) — plus stricte que celle des
// comptes clientes.
export function checkStrongPassword(pw: string): { ok: boolean; message: string } {
  if (pw.length < 10) return { ok: false, message: 'Le mot de passe doit contenir au moins 10 caractères.' }
  if (!/[a-z]/.test(pw)) return { ok: false, message: 'Le mot de passe doit contenir au moins une minuscule.' }
  if (!/[A-Z]/.test(pw)) return { ok: false, message: 'Le mot de passe doit contenir au moins une majuscule.' }
  if (!/[0-9]/.test(pw)) return { ok: false, message: 'Le mot de passe doit contenir au moins un chiffre.' }
  if (!/[^A-Za-z0-9]/.test(pw)) return { ok: false, message: 'Le mot de passe doit contenir au moins un caractère spécial (ex. ! ? # @ -).' }
  return { ok: true, message: 'Mot de passe fort ✓' }
}
