// Client-safe admin email check
// This file can be safely imported in client components

// Hardcoded admin email addresses
const ADMIN_EMAILS = [
  'admin@thefiredev.com',
  'rosterkamp@voitco.com'
].map(email => email.toLowerCase())

/**
 * Check if a specific email is an admin
 * This is a client-safe version that doesn't import server-only modules
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Get the list of admin emails (for display purposes only)
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS]
}