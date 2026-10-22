import { User } from 'firebase/auth';

export const ADMIN_EMAILS: string[] = [
  'ngongfavourkole@gmail.com',
  'admin@centerforcenters.cm',
];

export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.some(email => email.toLowerCase() === user.email?.toLowerCase());
}
