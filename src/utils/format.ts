/**
 * Utility functions for formatting numbers and text to Arabic.
 */

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Converts English digits (0-9) inside a number or string to Arabic digits (٠-٩).
 * @param val The value to convert (number or string)
 * @param decimals Optional decimal places to format numbers to.
 */
export function toArabicDigits(val: number | string | undefined | null, decimals: number = -1): string {
  if (val === undefined || val === null) return '٠';
  
  let str = '';
  if (typeof val === 'number') {
    if (decimals >= 0) {
      str = val.toFixed(decimals);
    } else {
      // If it's a number, convert to string preserving decimals if they exist
      str = String(val);
    }
  } else {
    str = String(val);
  }
  
  return str.replace(/[0-9]/g, (w) => ARABIC_DIGITS[Number(w)]);
}

/**
 * Formats a currency value and converts it to Arabic digits.
 * Replaces the '$' sign with 'جنيه' or keeping it as needed.
 */
export function formatArabicCurrency(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '٠٫٠٠ جنيه';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '٠٫٠٠ جنيه';
  
  // Format with thousands separator and decimal point using ar-EG locale
  let formatted = num.toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${formatted} جنيه`;
}
