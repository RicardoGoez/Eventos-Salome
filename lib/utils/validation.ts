/**
 * Utilidades de validación para formularios
 */

/**
 * Valida un número de tarjeta usando el algoritmo de Luhn
 */
export function validateCardNumber(cardNumber: string): boolean {
  // Remover espacios y caracteres no numéricos
  const cleaned = cardNumber.replace(/\s/g, "");
  
  // Debe tener entre 13 y 19 dígitos
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
  // Algoritmo de Luhn
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Valida una fecha de vencimiento (MM/AA)
 */
export function validateExpiryDate(expiry: string): { valid: boolean; error?: string } {
  if (!expiry || expiry.length !== 5) {
    return { valid: false, error: "La fecha debe tener formato MM/AA" };
  }
  
  const [month, year] = expiry.split("/");
  const monthNum = parseInt(month);
  const yearNum = parseInt("20" + year);
  
  // Validar mes
  if (monthNum < 1 || monthNum > 12) {
    return { valid: false, error: "El mes debe estar entre 01 y 12" };
  }
  
  // Validar año (no debe ser anterior al año actual)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  if (yearNum < currentYear) {
    return { valid: false, error: "La tarjeta ha expirado" };
  }
  
  if (yearNum === currentYear && monthNum < currentMonth) {
    return { valid: false, error: "La tarjeta ha expirado" };
  }
  
  return { valid: true };
}

/**
 * Valida un CVV (3 o 4 dígitos)
 */
export function validateCVV(cvv: string): boolean {
  const cleaned = cvv.replace(/\D/g, "");
  return cleaned.length === 3 || cleaned.length === 4;
}

/**
 * Valida el nombre en la tarjeta
 */
export function validateCardName(name: string): boolean {
  if (!name || name.trim().length < 3) {
    return false;
  }
  
  // Solo letras, espacios y algunos caracteres especiales comunes
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/;
  return nameRegex.test(name.trim());
}

/**
 * Detecta el tipo de tarjeta basado en el número
 */
export function detectCardType(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, "");
  
  if (/^4/.test(cleaned)) return "Visa";
  if (/^5[1-5]/.test(cleaned)) return "Mastercard";
  if (/^3[47]/.test(cleaned)) return "American Express";
  if (/^6(?:011|5)/.test(cleaned)) return "Discover";
  
  return "Tarjeta";
}

