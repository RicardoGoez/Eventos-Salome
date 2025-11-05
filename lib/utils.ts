import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como precio en pesos colombianos (COP)
 * @param amount - Cantidad a formatear
 * @param decimals - Número de decimales (default: 0 para COP)
 * @returns String formateado como "$12.345.678"
 */
export function formatCOP(amount: number, decimals: number = 0): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
