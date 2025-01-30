import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  // Round to 2 decimal places to avoid floating point precision issues
  const roundedValue = Math.round(value * 100) / 100;
  const hasDecimals = roundedValue % 1 !== 0;
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(roundedValue);
}

export function formatPrice(value: number): string {
  return `$${Math.round(value).toLocaleString('es-CL')}`;
}