import {
  Organization,
  OrgType,
  CameroonRegion,
  PowerReliability,
  InternetReliability,
  SocialLinks,
  SocialNetwork,
  PlaceEdit,
} from '../types';
import { translations } from './translations';
import { resolveRegion, editableTown } from './regions';

type Dictionary = typeof translations['en'];

export const PLACE_TYPES: OrgType[] = [
  'Learning center',
  'Cyber cafe',
  'Computer lab',
  'Study space',
  'Internet access point',
  'Charging point',
  'Club',
  'Affordable store',
  'Technology hub',
  'NGO',
  'Training provider',
  'Educational institution',
  'Other',
];

export const FACILITIES = [
  'Computers',
  'Internet',
  'Wi-Fi',
  'Workspace',
  'Quiet study area',
  'Power backup',
  'Charging sockets',
  'Printing',
  'Equipment',
  'Software',
  'Library',
  'Meeting space',
];

export const POWER_OPTIONS: PowerReliability[] = ['Backup power available', 'Grid power only', 'Unreliable power', 'Unknown'];
export const INTERNET_OPTIONS: InternetReliability[] = ['Stable', 'Limited', 'None', 'Unknown'];

export const SOCIAL_NETWORKS: SocialNetwork[] = ['facebook', 'instagram', 'tiktok', 'x', 'youtube', 'whatsapp'];

export function placeTypeLabel(type: string, t: Dictionary): string {
  return t.placeTypeNames[type] || type;
}

export function facilityLabel(facility: string, t: Dictionary): string {
  return t.facilityNames[facility] || facility;
}

export function isTeamManaged(org: Organization): boolean {
  return org.managedBy === 'team';
}

// Only http(s) links are ever rendered, so a stored "javascript:" value can't become a link.
function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function websiteUrl(value: string | undefined): string | null {
  const v = (value || '').trim();
  if (!v) return null;
  return safeHttpUrl(/^https?:\/\//i.test(v) ? v : `https://${v}`);
}

const SOCIAL_BASE: Record<Exclude<SocialNetwork, 'whatsapp'>, (handle: string) => string> = {
  facebook: h => `https://www.facebook.com/${h}`,
  instagram: h => `https://www.instagram.com/${h}`,
  tiktok: h => `https://www.tiktok.com/@${h}`,
  x: h => `https://x.com/${h}`,
  youtube: h => `https://www.youtube.com/@${h}`,
};

// Turns a stored full link, username or phone number into a link to open.
export function socialUrl(network: SocialNetwork, value: string | undefined): string | null {
  const v = (value || '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return safeHttpUrl(v);
  if (network === 'whatsapp') {
    let digits = v.replace(/\D/g, '');
    // Local Cameroon mobile numbers are 9 digits starting with 6
    if (digits.length === 9 && digits.startsWith('6')) digits = `237${digits}`;
    return digits.length >= 8 ? `https://wa.me/${digits}` : null;
  }
  const handle = v.replace(/^@/, '').replace(/[^\w.\-]/g, '');
  return handle ? SOCIAL_BASE[network](handle) : null;
}

// Editable form state shared by the admin "Add place" form and the organization dashboard.
export interface PlaceDraft {
  name: string;
  type: OrgType;
  region: CameroonRegion | '';
  town: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  socialLinks: SocialLinks;
  logoUrl: string;
  imageUrl: string;
  description: string;
  facilities: string[];
  studentAccess: string;
  fees: string;
  openingHours: string;
  powerReliability: PowerReliability;
  internetReliability: InternetReliability;
  bookingRequired: boolean | null;
  sourceNote: string;
}

export function emptyPlaceDraft(contactEmail = ''): PlaceDraft {
  return {
    name: '',
    type: 'Learning center',
    region: '',
    town: '',
    address: '',
    contactPhone: '',
    contactEmail,
    website: '',
    socialLinks: {},
    logoUrl: '',
    imageUrl: '',
    description: '',
    facilities: [],
    studentAccess: '',
    fees: '',
    openingHours: '',
    powerReliability: 'Unknown',
    internetReliability: 'Unknown',
    bookingRequired: null,
    sourceNote: '',
  };
}

export function placeDraftFromOrg(org: Organization): PlaceDraft {
  const region = resolveRegion(org);
  return {
    name: org.name || '',
    type: org.type || 'Other',
    region: region && region !== 'Online' ? region : '',
    town: editableTown(org.town),
    address: org.address || '',
    contactPhone: org.contactPhone || '',
    contactEmail: org.contactEmail || '',
    website: org.website || '',
    socialLinks: { ...(org.socialLinks || {}) },
    logoUrl: org.logoUrl || '',
    imageUrl: org.imageUrl || '',
    description: org.description || '',
    facilities: org.facilities || [],
    studentAccess: org.studentAccess || '',
    fees: org.fees || '',
    openingHours: org.openingHours || '',
    powerReliability: org.powerReliability || 'Unknown',
    internetReliability: org.internetReliability || 'Unknown',
    bookingRequired: org.bookingRequired ?? null,
    sourceNote: org.sourceNote || '',
  };
}

// Draft values from an owner's pending edit of a published place.
export function draftFromEdit(edit: PlaceEdit): Partial<PlaceDraft> {
  return placeDraftFromOrg({ ...(edit.changes as Partial<Organization>) } as Organization);
}

// Trimmed fields ready to store on an Organization document.
export function placeFieldsFromDraft(draft: PlaceDraft) {
  const socialLinks: SocialLinks = {};
  for (const network of SOCIAL_NETWORKS) {
    const value = draft.socialLinks[network]?.trim();
    if (value) socialLinks[network] = value;
  }
  return {
    name: draft.name.trim(),
    type: draft.type,
    region: draft.region || undefined,
    town: draft.town.trim(),
    address: draft.address.trim(),
    contactPhone: draft.contactPhone.trim(),
    contactEmail: draft.contactEmail.trim(),
    website: draft.website.trim(),
    socialLinks,
    logoUrl: draft.logoUrl.trim(),
    imageUrl: draft.imageUrl.trim(),
    description: draft.description.trim(),
    facilities: draft.facilities,
    studentAccess: draft.studentAccess.trim(),
    fees: draft.fees.trim(),
    openingHours: draft.openingHours.trim(),
    powerReliability: draft.powerReliability,
    internetReliability: draft.internetReliability,
    bookingRequired: draft.bookingRequired,
    lastConfirmed: new Date().toISOString().split('T')[0],
  };
}

export type PlaceFields = ReturnType<typeof placeFieldsFromDraft>;
