/**
 * Decimal and Money Calculation Utilities
 * FreshStock uses precise rounding to avoid floating-point drift.
 */

export function roundMoney(amount: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

export function formatINR(amount: number): string {
  const rounded = roundMoney(amount, 2);
  const parts = rounded.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian grouping format: e.g. 1,23,456.78
  const isNegative = integerPart.startsWith('-');
  if (isNegative) integerPart = integerPart.substring(1);

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}₹${formattedInteger}.${decimalPart}`;
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return roundMoney((part / total) * 100, 2);
}
