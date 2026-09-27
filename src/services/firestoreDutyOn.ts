import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch,
  getDocFromServer,
  type Unsubscribe
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  OBEntry, 
  IncidentQueueItem, 
  ControlRoomAlert, 
  ChatMessage,
  PatrolException, 
  PatrolCheckpoint,
  FleetVehicle,
  MultiSiteItem,
  OfficerRecord,
  UserAuthProfile,
  SecurityRosterPlan,
  TimesheetEntry,
  DocumentItem
} from '../types/dutyon';
import { TIKEDI_SITES, TIKEDI_OFFICERS } from '../data/tikediMasterData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively cleans an object by stripping any undefined values so that
 * Firestore setDoc/updateDoc never throws "Unsupported field value: undefined"
 */
export function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// ---------------- CONNECTION TEST ----------------
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testRef = doc(db, 'test', 'connection');
    await getDocFromServer(testRef);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline-persisted mode.');
    } else {
      console.info('Initial connection ping noted:', error instanceof Error ? error.message : String(error));
    }
    return false;
  }
}

// ---------------- OCCURRENCE BOOK (OB) SYNC ----------------
export function subscribeToOBEntries(
  onUpdate: (entries: OBEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const collectionPath = 'ob_entries';
  try {
    const q = query(collection(db, collectionPath), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: OBEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            time: data.time || '',
            headline: data.headline || '',
            notes: data.notes || '',
            status: data.status || 'completed',
            hasPhoto: Boolean(data.hasPhoto)
          });
        });
        onUpdate(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function syncOBEntryToCloud(entry: OBEntry): Promise<void> {
  const path = `ob_entries/${entry.id}`;
  try {
    const data = removeUndefinedFields({
      ...entry,
      createdAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'ob_entries', entry.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteOBEntryInCloud(entryId: string): Promise<void> {
  const path = `ob_entries/${entryId}`;
  try {
    await deleteDoc(doc(db, 'ob_entries', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- PATROL SCANS SYNC ----------------
export interface CloudPatrolScan {
  id: string;
  routeId: string;
  checkpointId: number;
  checkpointName: string;
  scannedAt: string;
  scannedBy: string;
  tagUid?: string;
  tagType?: string;
  method?: string;
  dwellTimeSec?: number;
  inspectionNotes?: string;
  photoUrl?: string;
  voiceNoteUrl?: string;
  audioDurationSec?: number;
  createdAt?: string;
}

export function subscribeToPatrolScans(
  onUpdate: (scans: CloudPatrolScan[]) => void
): Unsubscribe {
  const collectionPath = 'patrol_scans';
  try {
    const q = query(collection(db, collectionPath), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: CloudPatrolScan[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as CloudPatrolScan;
          list.push({ ...d, id: docSnap.id });
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function syncPatrolScanToCloud(scan: CloudPatrolScan): Promise<void> {
  const path = `patrol_scans/${scan.id}`;
  try {
    const data = removeUndefinedFields({
      ...scan,
      createdAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'patrol_scans', scan.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deletePatrolScanInCloud(scanId: string): Promise<void> {
  const path = `patrol_scans/${scanId}`;
  try {
    await deleteDoc(doc(db, 'patrol_scans', scanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllPatrolScansInCloud(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'patrol_scans'));
    const deletions = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletions);
  } catch (error) {
    console.error('Error clearing patrol scans in cloud:', error);
  }
}

// ---------------- PATROL EXCEPTIONS SYNC ----------------
export function subscribeToPatrolExceptions(
  onUpdate: (exceptions: PatrolException[]) => void
): Unsubscribe {
  const collectionPath = 'patrol_exceptions';
  try {
    const q = query(collection(db, collectionPath), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: PatrolException[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as PatrolException), id: docSnap.id });
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function syncPatrolExceptionToCloud(exc: PatrolException): Promise<void> {
  const path = `patrol_exceptions/${exc.id}`;
  try {
    const data = removeUndefinedFields({
      ...exc,
      createdAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'patrol_exceptions', exc.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deletePatrolExceptionInCloud(excId: string): Promise<void> {
  const path = `patrol_exceptions/${excId}`;
  try {
    await deleteDoc(doc(db, 'patrol_exceptions', excId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllPatrolExceptionsInCloud(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'patrol_exceptions'));
    const deletions = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletions);
  } catch (error) {
    console.error('Error clearing patrol exceptions in cloud:', error);
  }
}

// ---------------- INCIDENTS SYNC ----------------
export function subscribeToIncidents(
  onUpdate: (incidents: IncidentQueueItem[]) => void
): Unsubscribe {
  const collectionPath = 'incidents';
  try {
    const q = query(collection(db, collectionPath), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: IncidentQueueItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as IncidentQueueItem), id: docSnap.id });
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function syncIncidentToCloud(inc: IncidentQueueItem): Promise<void> {
  const path = `incidents/${inc.id}`;
  try {
    const data = removeUndefinedFields({
      ...inc,
      createdAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'incidents', inc.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function resolveIncidentInCloud(incidentId: string): Promise<void> {
  const path = `incidents/${incidentId}`;
  try {
    await updateDoc(doc(db, 'incidents', incidentId), {
      status: 'resolved'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteIncidentInCloud(incidentId: string): Promise<void> {
  const path = `incidents/${incidentId}`;
  try {
    await deleteDoc(doc(db, 'incidents', incidentId));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('offline') ||
      msg.includes('unavailable') ||
      msg.includes('failed-precondition')
    ) {
      console.warn('Firestore offline while deleting incident in cloud:', error);
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- ALERTS SYNC ----------------
export function subscribeToAlerts(
  onUpdate: (alerts: ControlRoomAlert[]) => void
): Unsubscribe {
  const collectionPath = 'alerts';
  try {
    const q = query(collection(db, collectionPath), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: ControlRoomAlert[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as ControlRoomAlert), id: docSnap.id });
        });
        // Sort descending so newest alerts are always first
        list.sort((a, b) => {
          const tA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : (parseInt(a.id.replace(/\D/g, '')) || 0);
          const tB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : (parseInt(b.id.replace(/\D/g, '')) || 0);
          return tB - tA;
        });
        onUpdate(list);
      },
      (error) => {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('offline') || (error as any)?.code === 'unavailable') {
          console.warn('Firestore offline while listening to alerts:', msg);
          return;
        }
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );
  } catch (error) {
    console.warn('Could not initialize alerts listener:', error);
    return () => {};
  }
}

export async function syncAlertToCloud(alert: ControlRoomAlert): Promise<void> {
  const path = `alerts/${alert.id}`;
  try {
    const data = removeUndefinedFields({
      ...alert,
      createdAt: (alert as any).createdAt || new Date().toISOString()
    });
    await setDoc(doc(db, 'alerts', alert.id), data, { merge: true });
  } catch (error) {
    const errStr = error instanceof Error ? error.message : String(error);
    if (errStr.includes('offline') || (error as any)?.code === 'unavailable') {
      console.warn('Firestore offline while syncing alert:', errStr);
      return;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function dismissAlertInCloud(alertId: string): Promise<void> {
  const path = `alerts/${alertId}`;
  try {
    await deleteDoc(doc(db, 'alerts', alertId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- TACTICAL COMMS / CHAT MESSAGES SYNC ----------------
export function subscribeToMessages(
  onUpdate: (messages: ChatMessage[]) => void
): Unsubscribe {
  const collectionPath = 'chat_messages';
  try {
    const q = query(collection(db, collectionPath), limit(120));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as ChatMessage), id: docSnap.id });
        });
        // Sort ascending so messages flow chronologically
        list.sort((a, b) => {
          const tA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : (parseInt(a.id.replace(/\D/g, '')) || 0);
          const tB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : (parseInt(b.id.replace(/\D/g, '')) || 0);
          return tA - tB;
        });
        onUpdate(list);
      },
      (error) => {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('offline') || (error as any)?.code === 'unavailable') {
          console.warn('Firestore offline while listening to chat_messages:', msg);
          return;
        }
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );
  } catch (error) {
    console.warn('Could not initialize messages listener:', error);
    return () => {};
  }
}

export async function syncMessageToCloud(msg: ChatMessage): Promise<void> {
  const path = `chat_messages/${msg.id}`;
  try {
    const data = removeUndefinedFields({
      ...msg,
      createdAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'chat_messages', msg.id), data, { merge: true });
  } catch (error) {
    const errStr = error instanceof Error ? error.message : String(error);
    if (errStr.includes('offline') || (error as any)?.code === 'unavailable') {
      console.warn('Firestore offline while syncing chat_message:', errStr);
      return;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ---------------- FLEET VEHICLES SYNC ----------------
export function subscribeToFleetVehicles(
  onUpdate: (vehicles: FleetVehicle[]) => void
): Unsubscribe {
  const collectionPath = 'fleet_vehicles';
  try {
    const q = query(collection(db, collectionPath), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: FleetVehicle[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as FleetVehicle), id: docSnap.id });
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function syncFleetVehicleToCloud(vehicle: FleetVehicle): Promise<void> {
  const path = `fleet_vehicles/${vehicle.id}`;
  try {
    const data = removeUndefinedFields({
      ...vehicle,
      createdAt: vehicle.createdAt || new Date().toISOString()
    });
    await setDoc(doc(db, 'fleet_vehicles', vehicle.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteFleetVehicleInCloud(vehicleId: string): Promise<void> {
  const path = `fleet_vehicles/${vehicleId}`;
  try {
    await deleteDoc(doc(db, 'fleet_vehicles', vehicleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- SITES & GEOFENCED PERIMETERS SYNC ----------------
export function subscribeToSites(
  onUpdate: (sites: MultiSiteItem[]) => void
): Unsubscribe {
  const collectionPath = 'sites';
  try {
    const q = query(collection(db, collectionPath), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: MultiSiteItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as MultiSiteItem), id: docSnap.id });
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function syncSiteToCloud(site: MultiSiteItem): Promise<void> {
  const path = `sites/${site.id}`;
  try {
    const data = removeUndefinedFields({
      ...site,
      createdAt: site.createdAt || new Date().toISOString()
    });
    await setDoc(doc(db, 'sites', site.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteSiteInCloud(siteId: string): Promise<void> {
  const path = `sites/${siteId}`;
  try {
    await deleteDoc(doc(db, 'sites', siteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- OFFICERS SYNC ----------------
export function subscribeToOfficers(
  onUpdate: (officers: OfficerRecord[]) => void
): Unsubscribe {
  const collectionPath = 'officers';
  try {
    const q = query(collection(db, collectionPath), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: OfficerRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as OfficerRecord), id: docSnap.id });
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function syncOfficerToCloud(officer: OfficerRecord): Promise<void> {
  const path = `officers/${officer.id}`;
  try {
    const data = removeUndefinedFields({
      ...officer,
      createdAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'officers', officer.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteOfficerInCloud(officerId: string): Promise<void> {
  const path = `officers/${officerId}`;
  try {
    await deleteDoc(doc(db, 'officers', officerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- USER PROFILES & RBAC ----------------
export async function saveUserProfileToCloud(profile: UserAuthProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    const data = removeUndefinedFields({
      ...profile,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'users', profile.uid), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserProfileFromCloud(uid: string): Promise<UserAuthProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserAuthProfile;
    }
    return null;
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('offline') ||
      msg.includes('Failed to get document') ||
      error?.code === 'unavailable' ||
      error?.code === 'failed-precondition'
    ) {
      console.warn('Firestore offline while retrieving user profile; falling back to local session profile:', msg);
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToUserProfile(
  uid: string,
  onUpdate: (profile: UserAuthProfile | null) => void
): Unsubscribe {
  const path = `users/${uid}`;
  try {
    return onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as UserAuthProfile);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('offline') || (error as any)?.code === 'unavailable') {
          console.warn('Firestore user profile snapshot operating in offline mode:', msg);
          return;
        }
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('offline') || (error as any)?.code === 'unavailable') {
      console.warn('Firestore user profile subscription offline initialization:', msg);
      return () => {};
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ---------------- ROSTER PLANS (MONTHLY & WEEKLY) ----------------

export async function saveRosterPlanToCloud(roster: SecurityRosterPlan): Promise<void> {
  const docId = roster.id || `${roster.siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${roster.year}_${roster.month}`;
  const path = `rosters/${docId}`;
  try {
    const data = removeUndefinedFields({
      ...roster,
      id: docId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'rosters', docId), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getRosterPlanFromCloud(rosterId: string): Promise<SecurityRosterPlan | null> {
  const path = `rosters/${rosterId}`;
  try {
    const snap = await getDoc(doc(db, 'rosters', rosterId));
    if (snap.exists()) {
      return snap.data() as SecurityRosterPlan;
    }
    return null;
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('offline') ||
      msg.includes('Failed to get document') ||
      error?.code === 'unavailable'
    ) {
      console.warn('Firestore offline while retrieving roster plan:', msg);
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToRosterPlan(
  rosterId: string,
  onUpdate: (plan: SecurityRosterPlan | null) => void
): Unsubscribe {
  const path = `rosters/${rosterId}`;
  try {
    return onSnapshot(
      doc(db, 'rosters', rosterId),
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as SecurityRosterPlan);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ---------------- TIMESHEET SESSIONS & BIOMETRIC PAYROLL SYNC ----------------

export function subscribeToTimesheets(
  onUpdate: (entries: TimesheetEntry[]) => void
): Unsubscribe {
  const collectionPath = 'timesheets';
  try {
    const q = query(collection(db, collectionPath), limit(200));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: TimesheetEntry[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as TimesheetEntry), id: docSnap.id });
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function syncTimesheetToCloud(entry: TimesheetEntry): Promise<void> {
  const path = `timesheets/${entry.id}`;
  try {
    const data = removeUndefinedFields({
      ...entry,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'timesheets', entry.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteTimesheetInCloud(entryId: string): Promise<void> {
  const path = `timesheets/${entryId}`;
  try {
    await deleteDoc(doc(db, 'timesheets', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllTimesheetsInCloud(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'timesheets'));
    const deletions = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletions);
  } catch (error) {
    console.error('Error clearing timesheets in cloud:', error);
  }
}

// ---------------- CLOUD DATA PURGE: REMOVE ALL NON-SILVER LAKES PLACEHOLDERS ----------------

export async function purgeAllPlaceholderDataFromCloud(): Promise<{
  purgedSites: number;
  purgedFleet: number;
  purgedOfficers: number;
  purgedIncidents: number;
}> {
  let purgedSites = 0;
  let purgedFleet = 0;
  let purgedOfficers = 0;
  let purgedIncidents = 0;

  try {
    // 1. Purge legacy demo sites that are not in Tikedi master sites
    const validSiteIds = new Set(TIKEDI_SITES.map((s) => s.id));
    const sitesSnap = await getDocs(collection(db, 'sites'));
    for (const d of sitesSnap.docs) {
      if (!validSiteIds.has(d.id)) {
        await deleteDoc(d.ref);
        purgedSites++;
      }
    }

    // 2. Purge legacy demo fleet vehicles
    const fleetSnap = await getDocs(collection(db, 'fleet_vehicles'));
    for (const d of fleetSnap.docs) {
      const data = d.data();
      const cs = (data.callSign || '').toLowerCase();
      if (!cs.includes('ar-01')) {
        await deleteDoc(d.ref);
        purgedFleet++;
      }
    }

    // 3. Purge legacy demo officers not in Tikedi master officers
    const validOfficerIds = new Set(TIKEDI_OFFICERS.map((o) => o.id));
    const offSnap = await getDocs(collection(db, 'officers'));
    for (const d of offSnap.docs) {
      if (!validOfficerIds.has(d.id)) {
        await deleteDoc(d.ref);
        purgedOfficers++;
      }
    }

    // 4. Purge ALL placeholder incidents so the incident register is completely clean
    const incSnap = await getDocs(collection(db, 'incidents'));
    for (const d of incSnap.docs) {
      await deleteDoc(d.ref);
      purgedIncidents++;
    }

    // 5. Purge old placeholder alerts
    const alertsSnap = await getDocs(collection(db, 'alerts'));
    for (const d of alertsSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 6. Purge old placeholder OB entries
    const obSnap = await getDocs(collection(db, 'ob_entries'));
    for (const d of obSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 7. Purge placeholder timesheets & rosters
    const tsSnap = await getDocs(collection(db, 'timesheets'));
    for (const d of tsSnap.docs) {
      await deleteDoc(d.ref);
    }
    const rosterSnap = await getDocs(collection(db, 'rosters'));
    for (const d of rosterSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 8. Purge patrol exceptions
    const excSnap = await getDocs(collection(db, 'patrol_exceptions'));
    for (const d of excSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.error('Error executing cloud data purge:', err);
  }

  return { purgedSites, purgedFleet, purgedOfficers, purgedIncidents };
}

export async function syncAllTikediDataToCloud(
  sites: MultiSiteItem[] = TIKEDI_SITES,
  officers: OfficerRecord[] = TIKEDI_OFFICERS
): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const site of sites) {
      const siteRef = doc(db, 'sites', site.id);
      batch.set(siteRef, site, { merge: true });
    }
    for (const off of officers) {
      const offRef = doc(db, 'officers', off.id);
      batch.set(offRef, off, { merge: true });
    }
    await batch.commit();
    console.log(`DutyOn: Successfully committed ${sites.length} Tikedi sites and ${officers.length} officers to Firestore`);
  } catch (err) {
    console.error('Error batch syncing Tikedi data to Firestore:', err);
  }
}

// ---------------- OFFICER DOCUMENTS CLOUD STORAGE ----------------

export async function saveOfficerDocumentToCloud(docItem: DocumentItem): Promise<void> {
  const path = `officer_documents/${docItem.id}`;
  try {
    const docRef = doc(db, 'officer_documents', docItem.id);
    await setDoc(docRef, {
      ...docItem,
      updatedAt: new Date().toISOString(),
      createdAt: docItem.createdAt || new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('offline') ||
      msg.includes('unavailable') ||
      msg.includes('failed-precondition') ||
      msg.includes('could not reach')
    ) {
      console.warn('Firestore offline while saving officer document:', error);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteOfficerDocumentFromCloud(docId: string): Promise<void> {
  const path = `officer_documents/${docId}`;
  try {
    await deleteDoc(doc(db, 'officer_documents', docId));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('offline') ||
      msg.includes('unavailable') ||
      msg.includes('failed-precondition')
    ) {
      console.warn('Firestore offline while deleting officer document:', error);
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToOfficerDocuments(callback: (docs: DocumentItem[]) => void): Unsubscribe {
  const path = 'officer_documents';
  const q = query(collection(db, 'officer_documents'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: DocumentItem[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as DocumentItem);
      });
      callback(items);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (
        msg.includes('offline') ||
        msg.includes('unavailable') ||
        msg.includes('failed-precondition') ||
        msg.includes('could not reach')
      ) {
        console.warn('Firestore offline in subscribeToOfficerDocuments');
        return;
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}


