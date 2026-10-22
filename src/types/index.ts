// Kinds of places. Stored in English; labels are translated in the UI.
export type OrgType =
  | 'Learning center'
  | 'Cyber cafe'
  | 'Computer lab'
  | 'Study space'
  | 'Internet access point'
  | 'Charging point'
  | 'Club'
  | 'Affordable store'
  | 'Technology hub'
  | 'NGO'
  | 'Training provider'
  | 'Educational institution'
  | 'Other';

export type SocialNetwork = 'facebook' | 'instagram' | 'tiktok' | 'x' | 'youtube' | 'whatsapp';

// Each value is a full link or a username; WhatsApp is a phone number.
export type SocialLinks = Partial<Record<SocialNetwork, string>>;

// 'team' = added by admins from public information until the real owner claims it.
export type ManagedBy = 'owner' | 'team';

// Cameroon's 10 regions. Stored in English; labels are translated in the UI.
export type CameroonRegion =
  | 'Adamawa'
  | 'Centre'
  | 'East'
  | 'Far North'
  | 'Littoral'
  | 'North'
  | 'Northwest'
  | 'South'
  | 'Southwest'
  | 'West';

// Opportunities can also run online instead of in a region.
export type OpportunityRegion = CameroonRegion | 'Online';

export type PowerReliability = 
  | 'Backup power available' 
  | 'Grid power only' 
  | 'Unreliable power' 
  | 'Unknown';

export type InternetReliability = 
  | 'Stable' 
  | 'Limited' 
  | 'None' 
  | 'Unknown';

export type OpportunityCategory = 
  | 'Training' 
  | 'Workshop' 
  | 'Event' 
  | 'Internship' 
  | 'Scholarship' 
  | 'Hackathon' 
  | 'Other';

export type EducationLevel = 
  | 'Secondary school' 
  | 'High school' 
  | 'University' 
  | 'Graduate or young professional' 
  | 'Any';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// Filters passed when navigating to a list view (from home quick filters or a search).
export interface NavFilters {
  category?: string;
  region?: string;
  placeType?: string;
  cost?: 'free' | 'paid';
  query?: string;
}

export interface Organization {
  id: string; // Document ID = ownerUid
  name: string;
  type: OrgType;
  region?: CameroonRegion; // Older records may only have a town; see resolveRegion()
  town: string; // Free text town or city
  address: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  socialLinks?: SocialLinks;
  description: string;
  facilities: string[];
  studentAccess: string; // Empty means unknown
  fees: string; // Empty means unknown
  openingHours: string; // Empty means unknown
  powerReliability: PowerReliability;
  internetReliability: InternetReliability;
  bookingRequired: boolean | null; // null means unknown
  lastConfirmed: string;
  status: ApprovalStatus;
  isSample: boolean; // Legacy demo records; never shown publicly
  ownerUid: string; // Empty for team-managed places nobody has claimed yet
  managedBy?: ManagedBy; // Missing on older records, which were all owner-managed
  sourceNote?: string; // Where the team got the details (team-managed places)
  addedBy?: string; // Admin uid that added a team-managed place
  claimedAt?: string;
  createdAt: string;
  logoUrl?: string;
  imageUrl?: string;
}

export interface Opportunity {
  id: string;
  orgId: string;
  orgName?: string;
  title: string;
  category: OpportunityCategory;
  description: string;
  interests: string[];
  educationLevels: EducationLevel[];
  region?: OpportunityRegion; // Older records may only have a town; see resolveRegion()
  town: string; // Free text town or city, may be empty for online
  startDate: string;
  deadline: string;
  cost: number; // 0 means free
  costNote: string;
  eligibility: string;
  registrationLink: string;
  status: ApprovalStatus;
  isSample: boolean;
  createdAt: string;
  flyerUrl?: string; // Event flyer / poster URL (for schedule, speakers, agenda)
  imageUrl?: string; // Event banner / photo URL
}

export interface Report {
  id?: string;
  targetType: 'organization' | 'opportunity';
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
  reporterEmail?: string;
  status: 'new' | 'resolved';
  createdAt: string;
}

export type UserRole = 'student' | 'organization';

export interface UserProfile {
  uid: string;
  role: UserRole;
  displayName: string;
  email: string;
  preferredLanguage: 'en' | 'fr';
  createdAt: string;
  region?: string;
  town?: string;
  educationLevel?: string;
  interests?: string[];
  updatedAt?: string;
}

export interface Claim {
  id?: string;
  orgId: string;
  orgName: string;
  claimantUid: string;
  claimantEmail: string;
  claimantName: string;
  relationship: string;
  phone: string;
  verificationDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
}
