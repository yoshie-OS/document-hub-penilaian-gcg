import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to reset document metadata to seed data
export const resetDocumentMetadata = () => {
  localStorage.removeItem('documentMetadata');
  window.location.reload(); // Reload to reinitialize with seed data
};

