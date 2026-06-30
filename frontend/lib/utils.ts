import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatPercent(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}

export function severityColour(s: string): string {
  const m: Record<string, string> = {
    CRITICAL: '#E5484D', HIGH: '#F5A623', MEDIUM: '#3E63DD', LOW: '#30A46C',
  }
  return m[s] ?? '#64748B'
}
