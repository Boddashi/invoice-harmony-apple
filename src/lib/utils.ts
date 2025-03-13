
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add custom colors for easy reference
export const customColors = {
  lavender: '#9e9de9',
  forest: '#004738',
  coral: '#ff9269',
}
