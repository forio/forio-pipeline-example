import { clsx, type ClassValue } from 'clsx';

/**
 * Encapsulates class resolution for future extensibility.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(...inputs);
}
