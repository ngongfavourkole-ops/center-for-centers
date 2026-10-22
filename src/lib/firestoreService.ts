import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Organization, Opportunity, Report, ApprovalStatus, UserProfile, UserRole } from '../types';
import { SAMPLE_ORGANIZATIONS, SAMPLE_OPPORTUNITIES } from '../data/sampleData';

const ORGS_COLLECTION = 'organizations';
const OPPS_COLLECTION = 'opportunities';
const REPORTS_COLLECTION = 'reports';
const USERS_COLLECTION = 'users';

export async function fetchApprovedOrganizations(): Promise<Organization[]> {
  try {
    const q = query(collection(db, ORGS_COLLECTION), where('status', '==', 'approved'));
    const snapshot = await getDocs(q);
    const orgs: Organization[] = [];
    snapshot.forEach(docSnap => {
      orgs.push({ id: docSnap.id, ...(docSnap.data() as Omit<Organization, 'id'>) });
    });
    return orgs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORGS_COLLECTION);
    return [];
  }
}

export async function fetchApprovedOpportunities(): Promise<Opportunity[]> {
  try {
    const q = query(collection(db, OPPS_COLLECTION), where('status', '==', 'approved'));
    const snapshot = await getDocs(q);
    const opps: Opportunity[] = [];
    snapshot.forEach(docSnap => {
      opps.push({ id: docSnap.id, ...(docSnap.data() as Omit<Opportunity, 'id'>) });
    });
    return opps;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, OPPS_COLLECTION);
    return [];
  }
}

export async function fetchOrganizationById(id: string): Promise<Organization | null> {
  try {
    const docSnap = await getDoc(doc(db, ORGS_COLLECTION, id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<Organization, 'id'>) };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${ORGS_COLLECTION}/${id}`);
    return null;
  }
}

export async function fetchOpportunityById(id: string): Promise<Opportunity | null> {
  try {
    const docSnap = await getDoc(doc(db, OPPS_COLLECTION, id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<Opportunity, 'id'>) };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${OPPS_COLLECTION}/${id}`);
    return null;
  }
}

export async function fetchOrgByOwner(ownerUid: string): Promise<Organization | null> {
  try {
    const docSnap = await getDoc(doc(db, ORGS_COLLECTION, ownerUid));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<Organization, 'id'>) };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${ORGS_COLLECTION}/${ownerUid}`);
    return null;
  }
}

function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

export async function saveOrganizationProfile(
  ownerUid: string,
  data: Omit<Organization, 'id' | 'ownerUid' | 'status' | 'isSample' | 'createdAt'>,
  existingOrg?: Organization | null
): Promise<void> {
  const orgRef = doc(db, ORGS_COLLECTION, ownerUid);
  const payload: Omit<Organization, 'id'> = {
    ...data,
    ownerUid,
    status: 'pending',
    isSample: existingOrg ? existingOrg.isSample : false,
    createdAt: existingOrg ? existingOrg.createdAt : new Date().toISOString(),
  };

  try {
    await setDoc(orgRef, removeUndefined(payload), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ORGS_COLLECTION}/${ownerUid}`);
  }
}

export async function fetchOpportunitiesByOrg(orgId: string): Promise<Opportunity[]> {
  try {
    const q = query(collection(db, OPPS_COLLECTION), where('orgId', '==', orgId));
    const snapshot = await getDocs(q);
    const opps: Opportunity[] = [];
    snapshot.forEach(docSnap => {
      opps.push({ id: docSnap.id, ...(docSnap.data() as Omit<Opportunity, 'id'>) });
    });
    return opps;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, OPPS_COLLECTION);
    return [];
  }
}

export async function saveOpportunity(
  orgId: string,
  opportunityId: string | null,
  data: Omit<Opportunity, 'id' | 'orgId' | 'status' | 'isSample' | 'createdAt'>
): Promise<string> {
  try {
    if (opportunityId) {
      const oppRef = doc(db, OPPS_COLLECTION, opportunityId);
      await updateDoc(oppRef, removeUndefined({
        ...data,
        orgId,
        status: 'pending',
      }));
      return opportunityId;
    } else {
      const oppRef = collection(db, OPPS_COLLECTION);
      const newDoc = await addDoc(oppRef, removeUndefined({
        ...data,
        orgId,
        status: 'pending',
        isSample: false,
        createdAt: new Date().toISOString(),
      }));
      return newDoc.id;
    }
  } catch (error) {
    handleFirestoreError(
      error,
      opportunityId ? OperationType.UPDATE : OperationType.CREATE,
      opportunityId ? `${OPPS_COLLECTION}/${opportunityId}` : OPPS_COLLECTION
    );
    throw error;
  }
}

export async function deleteOpportunity(opportunityId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, OPPS_COLLECTION, opportunityId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${OPPS_COLLECTION}/${opportunityId}`);
  }
}

export async function submitUserReport(reportData: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<void> {
  try {
    await addDoc(collection(db, REPORTS_COLLECTION), {
      ...reportData,
      status: 'new',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, REPORTS_COLLECTION);
  }
}

export async function fetchReportsForAdmin(): Promise<Report[]> {
  try {
    const snapshot = await getDocs(collection(db, REPORTS_COLLECTION));
    const reports: Report[] = [];
    snapshot.forEach(docSnap => {
      reports.push({ id: docSnap.id, ...(docSnap.data() as Omit<Report, 'id'>) });
    });
    return reports;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REPORTS_COLLECTION);
    return [];
  }
}

export async function fetchAllOrganizationsForAdmin(): Promise<Organization[]> {
  try {
    const snapshot = await getDocs(collection(db, ORGS_COLLECTION));
    const orgs: Organization[] = [];
    snapshot.forEach(docSnap => {
      orgs.push({ id: docSnap.id, ...(docSnap.data() as Omit<Organization, 'id'>) });
    });
    return orgs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORGS_COLLECTION);
    return [];
  }
}

export async function fetchAllOpportunitiesForAdmin(): Promise<Opportunity[]> {
  try {
    const snapshot = await getDocs(collection(db, OPPS_COLLECTION));
    const opps: Opportunity[] = [];
    snapshot.forEach(docSnap => {
      opps.push({ id: docSnap.id, ...(docSnap.data() as Omit<Opportunity, 'id'>) });
    });
    return opps;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, OPPS_COLLECTION);
    return [];
  }
}

export async function updateOrganizationStatus(orgId: string, status: ApprovalStatus): Promise<void> {
  try {
    const orgRef = doc(db, ORGS_COLLECTION, orgId);
    await updateDoc(orgRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORGS_COLLECTION}/${orgId}`);
  }
}

export async function updateOpportunityStatus(oppId: string, status: ApprovalStatus): Promise<void> {
  try {
    const oppRef = doc(db, OPPS_COLLECTION, oppId);
    await updateDoc(oppRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${OPPS_COLLECTION}/${oppId}`);
  }
}

export async function loadSampleDataToFirestore(): Promise<{ orgsCount: number; oppsCount: number }> {
  try {
    let orgsCount = 0;
    let oppsCount = 0;

    for (const org of SAMPLE_ORGANIZATIONS) {
      const docRef = doc(db, ORGS_COLLECTION, org.ownerUid);
      await setDoc(docRef, org);
      orgsCount++;
    }

    for (const opp of SAMPLE_OPPORTUNITIES) {
      await addDoc(collection(db, OPPS_COLLECTION), opp);
      oppsCount++;
    }

    return { orgsCount, oppsCount };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'sample_data_loader');
    throw error;
  }
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...(docSnap.data() as Omit<UserProfile, 'uid'>) };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${uid}`);
    return null;
  }
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, profile.uid);
    const cleanData = removeUndefined({
      role: profile.role,
      displayName: profile.displayName || '',
      email: profile.email || '',
      preferredLanguage: profile.preferredLanguage || 'en',
      createdAt: profile.createdAt || new Date().toISOString(),
      region: profile.region || '',
      educationLevel: profile.educationLevel || '',
      interests: profile.interests || [],
    });
    await setDoc(userRef, cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${USERS_COLLECTION}/${profile.uid}`);
    throw error;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    // Note: Never update role from here; role updates can only be performed by admins
    const { role: _role, uid: _uid, ...allowedFields } = data;
    await updateDoc(userRef, removeUndefined({
      ...allowedFields,
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${uid}`);
    throw error;
  }
}

export async function fetchAllUsersForAdmin(): Promise<UserProfile[]> {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users: UserProfile[] = [];
    snapshot.forEach(docSnap => {
      users.push({ uid: docSnap.id, ...(docSnap.data() as Omit<UserProfile, 'uid'>) });
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
    return [];
  }
}

export async function updateUserRoleByAdmin(uid: string, newRole: UserRole): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${uid}`);
    throw error;
  }
}
