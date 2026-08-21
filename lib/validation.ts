/**
 * Password Policy & Input Sanitization Utilities
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push("Password must be at least 10 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter (A-Z)");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter (a-z)");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number (0-9)");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special symbol (!@#$%^&*)");
  }

  // Common weak passwords check
  const commonWeak = ["password123", "admin12345", "1234567890", "celebration123", "cafe123456"];
  if (commonWeak.some((weak) => password.toLowerCase().includes(weak))) {
    errors.push("Password contains commonly used weak words. Choose a unique password.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .trim()
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
