import { User } from 'firebase/auth';
import { UserProfile } from '../types';

// Admin access is granted only by this list. Keep it in sync with isAdmin() in firestore.rules,
// which is what actually protects the data.
export const ADMIN_EMAILS: string[] = [
  'ngongfavourkole@gmail.com',
  'admin@centerforcenters.cm',
];

export type AppRole = 'student' | 'organization' | 'admin';

export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user || !user.email || !user.emailVerified) return false;
  return ADMIN_EMAILS.some(email => email.toLowerCase() === user.email?.toLowerCase());
}

// Admins come from the email list; everyone else from the role they chose on first sign-in.
export function resolveRole(user: User | null, profile: UserProfile | null): AppRole | null {
  if (!user) return null;
  if (isUserAdmin(user)) return 'admin';
  return profile?.role || null;
}
