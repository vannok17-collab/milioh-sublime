export function checkPasswordStrength(pw: string): { ok: boolean; message: string } {
  if (pw.length < 8) return { ok: false, message: 'Le mot de passe doit contenir au moins 8 caractères.' }
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return { ok: false, message: 'Le mot de passe doit contenir des lettres et des chiffres.' }
  return { ok: true, message: 'Mot de passe valide.' }
}
