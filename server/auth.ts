import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // At least 6 characters
  return password.length >= 6;
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}

export function validateDepartment(department: string): boolean {
  return department.trim().length >= 1;
}

export function validateDateOfBirth(dob: string): boolean {
  const date = new Date(dob);
  return date instanceof Date && !isNaN(date.getTime());
}
