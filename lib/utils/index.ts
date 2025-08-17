import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export specific utilities to avoid conflicts
export * as helpers from './helpers'
export * from './logger'
export * from './slug'