import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// Shared by the on-screen counter and the grading prompt so they always agree.
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
