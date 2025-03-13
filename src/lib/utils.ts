
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Custom color palette
export const customColors = {
  lavender: '#9e9de9',
  darkGreen: '#004738',
  coral: '#ff9269'
}
