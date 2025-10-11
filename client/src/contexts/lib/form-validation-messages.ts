/**
 * LOW-019: Enhanced form validation error messages
 */

export const validationMessages = {
  // Required fields
  required: (field: string) => `${field} is required`,
  
  // Email validation
  email: {
    invalid: 'Please enter a valid email address',
    required: 'Email is required',
    taken: 'This email is already registered',
  },
  
  // Password validation
  password: {
    required: 'Password is required',
    minLength: (min: number) => `Password must be at least ${min} characters`,
    maxLength: (max: number) => `Password must be at most ${max} characters`,
    weak: 'Password is too weak. Use a mix of letters, numbers, and symbols',
    uppercase: 'Password must contain at least one uppercase letter',
    lowercase: 'Password must contain at least one lowercase letter',
    number: 'Password must contain at least one number',
    special: 'Password must contain at least one special character',
    mismatch: 'Passwords do not match',
    common: 'This password is too common. Please choose a different one',
  },
  
  // Username validation
  username: {
    required: 'Username is required',
    minLength: (min: number) => `Username must be at least ${min} characters`,
    maxLength: (max: number) => `Username must be at most ${max} characters`,
    invalid: 'Username can only contain letters, numbers, and underscores',
    taken: 'This username is already taken',
  },
  
  // Phone validation
  phone: {
    invalid: 'Please enter a valid phone number',
    required: 'Phone number is required',
  },
  
  // URL validation
  url: {
    invalid: 'Please enter a valid URL (e.g., https://example.com)',
    required: 'URL is required',
  },
  
  // Number validation
  number: {
    invalid: 'Please enter a valid number',
    min: (min: number) => `Must be at least ${min}`,
    max: (max: number) => `Must be at most ${max}`,
    positive: 'Must be a positive number',
    integer: 'Must be a whole number',
  },
  
  // Date validation
  date: {
    invalid: 'Please enter a valid date',
    past: 'Date must be in the past',
    future: 'Date must be in the future',
    min: (date: string) => `Date must be after ${date}`,
    max: (date: string) => `Date must be before ${date}`,
  },
  
  // File validation
  file: {
    required: 'Please select a file',
    size: (maxSize: string) => `File size must be less than ${maxSize}`,
    type: (types: string) => `File type must be ${types}`,
  },
  
  // Payment validation
  payment: {
    cardNumber: 'Please enter a valid card number',
    expiry: 'Please enter a valid expiry date (MM/YY)',
    cvv: 'Please enter a valid CVV',
    zip: 'Please enter a valid ZIP code',
  },
  
  // Generic validation
  generic: {
    invalid: 'This field contains an invalid value',
    tooShort: (min: number) => `Must be at least ${min} characters`,
    tooLong: (max: number) => `Must be at most ${max} characters`,
    pattern: 'Format is invalid',
  },
};

// Validation helper functions
export function getPasswordStrength(password: string): {
  score: number;
  message: string;
  color: string;
} {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  const strength = {
    0: { message: 'Very Weak', color: 'text-red-600' },
    1: { message: 'Weak', color: 'text-red-500' },
    2: { message: 'Fair', color: 'text-orange-500' },
    3: { message: 'Good', color: 'text-yellow-500' },
    4: { message: 'Strong', color: 'text-green-500' },
    5: { message: 'Very Strong', color: 'text-green-600' },
    6: { message: 'Excellent', color: 'text-green-700' },
  }[Math.min(score, 6)] || { message: 'Unknown', color: 'text-gray-500' };
  
  return { score, ...strength };
}

export function validateEmail(email: string): string | null {
  if (!email) return validationMessages.email.required;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return validationMessages.email.invalid;
  }
  
  return null;
}

export function validatePassword(password: string): string[] {
  const errors: string[] = [];
  
  if (!password) {
    return [validationMessages.password.required];
  }
  
  if (password.length < 8) {
    errors.push(validationMessages.password.minLength(8));
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push(validationMessages.password.uppercase);
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push(validationMessages.password.lowercase);
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push(validationMessages.password.number);
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push(validationMessages.password.special);
  }
  
  // Check for common passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push(validationMessages.password.common);
  }
  
  return errors;
}

export function validateUsername(username: string): string | null {
  if (!username) return validationMessages.username.required;
  
  if (username.length < 3) {
    return validationMessages.username.minLength(3);
  }
  
  if (username.length > 20) {
    return validationMessages.username.maxLength(20);
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return validationMessages.username.invalid;
  }
  
  return null;
}
