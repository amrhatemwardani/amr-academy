/**
 * Money formatting utilities.
 *
 * All monetary values in the database are numeric(12,2) in EGP.
 * Currency symbol is read from the settings table via the server,
 * but for the formatter we default to EGP to avoid blocking reads.
 *
 * RULE: Never perform financial arithmetic in this file or in the browser.
 *       All calculations (balances, totals, allocations) happen in Postgres.
 *       This file only formats numbers for display.
 */

const DEFAULT_CURRENCY = 'EGP'

/**
 * Formats a numeric amount for display.
 *
 * @param amount    - The amount to format (from DB numeric field)
 * @param currency  - ISO 4217 currency code (default: EGP)
 * @param locale    - BCP 47 locale string for number formatting
 */
export function formatMoney(
  amount: number | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  locale: string = 'ar-EG'
): string {
  if (amount === null || amount === undefined) return '—'

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Fallback if currency code is invalid
    return `${currency} ${amount.toFixed(2)}`
  }
}

/**
 * Formats money for English locale.
 */
export function formatMoneyEn(
  amount: number | null | undefined,
  currency: string = DEFAULT_CURRENCY
): string {
  return formatMoney(amount, currency, 'en-EG')
}

/**
 * Parses a money string back to a number.
 * Used for form input validation only.
 */
export function parseMoney(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const parsed = parseFloat(cleaned)
  if (isNaN(parsed)) return 0
  // Round to 2 decimal places to avoid floating point issues
  return Math.round(parsed * 100) / 100
}

/**
 * Returns true if the amount is a valid positive money value.
 */
export function isValidAmount(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value) && value > 0
}
