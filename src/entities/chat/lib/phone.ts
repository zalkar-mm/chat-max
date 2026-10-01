const RU_LENGTH = 11
const BY_LENGTH = 12
const BY_PREFIX = '375'

/** Оставляет только цифры; российский номер через 8 приводит к 7. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === RU_LENGTH && digits.startsWith('8')) return `7${digits.slice(1)}`
  return digits
}

/** GREEN-API ищет аккаунты MAX только по номерам России (+7) и Беларуси (+375). */
export function isSupportedPhone(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false
  const isRu = digits.length === RU_LENGTH && digits.startsWith('7')
  const isBy = digits.length === BY_LENGTH && digits.startsWith(BY_PREFIX)
  return isRu || isBy
}

const RU_PATTERN = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/
const BY_PATTERN = /^375(\d{2})(\d{3})(\d{2})(\d{2})$/

/** `79991234567` → `+7 999 123-45-67`, `375291234567` → `+375 29 123-45-67`. */
export function formatPhone(digits: string): string {
  const ru = RU_PATTERN.exec(digits)
  if (ru) return `+7 ${ru[1]} ${ru[2]}-${ru[3]}-${ru[4]}`
  const by = BY_PATTERN.exec(digits)
  if (by) return `+375 ${by[1]} ${by[2]}-${by[3]}-${by[4]}`
  return `+${digits}`
}
