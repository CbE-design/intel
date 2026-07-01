import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Recursively sanitizes an object to be safe for Next.js Server Actions.
 * Converts Firestore Timestamps (objects with seconds/nanoseconds) to ISO strings.
 */
export function sanitizeForServer<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  // Handle Firestore Timestamps or similar objects
  if (typeof obj === 'object' && 'seconds' in obj && 'nanoseconds' in obj) {
    try {
      return new Date((obj as any).seconds * 1000).toISOString() as any;
    } catch (e) {
      return obj;
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForServer) as any;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeForServer((obj as any)[key]);
      }
    }
    return sanitized;
  }

  return obj;
}
