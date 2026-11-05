const formatterDollar = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatterDollarSI = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  compactDisplay: 'short',
  maximumSignificantDigits: 2,
});

/**
 * Formats a number as US dollars with two decimal places.
 * @param n - The number to format (undefined treated as 0).
 * @returns Formatted currency string.
 */
export const formatDollar = (n?: number): string => formatterDollar.format(n ?? 0);

/**
 * Formats a number as US dollars in compact notation with two significant digits.
 * @param n - The number to format (undefined treated as 0).
 * @returns Formatted compact currency string (suffix in lowercase).
 */
export const formatDollarSI = (n?: number): string =>
  formatterDollarSI.format(n ?? 0).toLowerCase();
