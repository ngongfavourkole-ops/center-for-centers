export type OrgType = 
  | 'Learning center' 
  | 'Training provider' 
  | 'NGO' 
  | 'Technology hub' 
  | 'Educational institution' 
  | 'Other';

export type CameroonTown = 
  | 'Buea' 
  | 'Limbe' 
  | 'Tiko' 
  | 'Kumba' 
  | 'Other';

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

export interface Organization {
  id: string; // Document ID = ownerUid
  name: string;
  type: OrgType;
  town: CameroonTown;
  address: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  description: string;
  facilities: string[];
  studentAccess: string;
  fees: string;
  openingHours: string;
  powerReliability: PowerReliability;
  internetReliability: InternetReliability;
  bookingRequired: boolean;
  lastConfirmed: string;
  status: ApprovalStatus;
  isSample: boolean;
  ownerUid: string;
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
  town: string;
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
  verificationDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
