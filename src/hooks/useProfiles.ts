import { useState, useEffect, useCallback } from 'react';
import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy
} from '../firebase';
import { ManagedProfile } from '../types/profile';
import { SAMPLE_PROFILES } from '../utils/profileHelpers';

export function useProfiles(userId: string | undefined) {
  const [profiles, setProfiles] = useState<ManagedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  const isDemoUser = !!(userId && userId.startsWith('demo-'));

  // Load profiles
  useEffect(() => {
    if (!userId) {
      setProfiles([]);
      setLoading(false);
      setIsLive(false);
      return;
    }

    setLoading(true);
    setError(null);

    // DEMO USER: Use LocalStorage with reactive state
    if (isDemoUser) {
      const storageKey = `profiles_${userId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProfiles(parsed);
          setLastSyncTime(new Date());
          setIsLive(true);
          setLoading(false);
          return;
        } catch {
          // recreate
        }
      }

      // Initialize with sample profiles for instant demo experience
      const now = Date.now();
      const initialProfiles: ManagedProfile[] = SAMPLE_PROFILES.map((sample, idx) => ({
        ...sample,
        id: `profile-${now}-${idx}`,
        userId,
        createdAt: now - idx * 3600000,
        updatedAt: now - idx * 1800000
      }));

      localStorage.setItem(storageKey, JSON.stringify(initialProfiles));
      setProfiles(initialProfiles);
      setLastSyncTime(new Date());
      setIsLive(true);
      setLoading(false);
      return;
    }

    // REAL FIREBASE USER: Cloud Firestore with onSnapshot listener
    try {
      const profilesCollectionRef = collection(db, 'users', userId, 'profiles');
      const q = query(profilesCollectionRef, orderBy('updatedAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: ManagedProfile[] = [];
          snapshot.forEach((docSnapshot) => {
            items.push({
              id: docSnapshot.id,
              ...docSnapshot.data()
            } as ManagedProfile);
          });
          setProfiles(items);
          setLastSyncTime(new Date());
          setIsLive(true);
          setLoading(false);
        },
        (err) => {
          console.warn('Firestore real-time subscription notice:', err);
          setError(err.message || 'Connecting to Firestore cloud partition...');
          setLoading(false);
          setIsLive(false);

          // Fallback to local cache if Firestore is not reachable
          const storageKey = `profiles_${userId}`;
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            try {
              setProfiles(JSON.parse(cached));
            } catch {
              // ignore
            }
          }
        }
      );

      return () => {
        unsubscribe();
        setIsLive(false);
      };
    } catch (err: any) {
      console.error('Failed to setup Firestore listener:', err);
      setError(err.message || 'Firestore connection issue');
      setLoading(false);
    }
  }, [userId, isDemoUser]);

  // Sync state to local storage backup
  const saveToLocalDemo = useCallback((updated: ManagedProfile[]) => {
    if (!userId) return;
    localStorage.setItem(`profiles_${userId}`, JSON.stringify(updated));
    setProfiles(updated);
    setLastSyncTime(new Date());
  }, [userId]);

  // Create new profile
  const addProfile = useCallback(async (profileData: Omit<ManagedProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) throw new Error('User must be authenticated to create profiles');
    const now = Date.now();
    const newDoc = {
      ...profileData,
      userId,
      createdAt: now,
      updatedAt: now
    };

    if (isDemoUser) {
      const id = `profile-${now}-${Math.random().toString(36).slice(2, 7)}`;
      const createdItem: ManagedProfile = { id, ...newDoc };
      const updated = [createdItem, ...profiles];
      saveToLocalDemo(updated);
      return id;
    }

    try {
      const docRef = await addDoc(collection(db, 'users', userId, 'profiles'), newDoc);
      return docRef.id;
    } catch (err: any) {
      console.warn('Firestore addDoc fallback:', err);
      const id = `profile-${now}-${Math.random().toString(36).slice(2, 7)}`;
      const createdItem: ManagedProfile = { id, ...newDoc };
      saveToLocalDemo([createdItem, ...profiles]);
      return id;
    }
  }, [userId, isDemoUser, profiles, saveToLocalDemo]);

  // Update profile
  const updateProfile = useCallback(async (profileId: string, updates: Partial<ManagedProfile>) => {
    if (!userId) throw new Error('User must be authenticated to edit profiles');

    if (isDemoUser) {
      const updated = profiles.map(p => 
        p.id === profileId ? { ...p, ...updates, updatedAt: Date.now() } : p
      );
      saveToLocalDemo(updated);
      return;
    }

    try {
      const profileDocRef = doc(db, 'users', userId, 'profiles', profileId);
      await updateDoc(profileDocRef, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (err: any) {
      console.warn('Firestore updateDoc fallback:', err);
      const updated = profiles.map(p => 
        p.id === profileId ? { ...p, ...updates, updatedAt: Date.now() } : p
      );
      saveToLocalDemo(updated);
    }
  }, [userId, isDemoUser, profiles, saveToLocalDemo]);

  // Delete profile
  const deleteProfile = useCallback(async (profileId: string) => {
    if (!userId) throw new Error('User must be authenticated to delete profiles');

    if (isDemoUser) {
      const updated = profiles.filter(p => p.id !== profileId);
      saveToLocalDemo(updated);
      return;
    }

    try {
      const profileDocRef = doc(db, 'users', userId, 'profiles', profileId);
      await deleteDoc(profileDocRef);
    } catch (err: any) {
      console.warn('Firestore deleteDoc fallback:', err);
      const updated = profiles.filter(p => p.id !== profileId);
      saveToLocalDemo(updated);
    }
  }, [userId, isDemoUser, profiles, saveToLocalDemo]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (profileId: string, currentVal: boolean) => {
    if (!userId) return;

    if (isDemoUser) {
      const updated = profiles.map(p => 
        p.id === profileId ? { ...p, favorite: !currentVal, updatedAt: Date.now() } : p
      );
      saveToLocalDemo(updated);
      return;
    }

    try {
      const profileDocRef = doc(db, 'users', userId, 'profiles', profileId);
      await updateDoc(profileDocRef, {
        favorite: !currentVal,
        updatedAt: Date.now()
      });
    } catch (err: any) {
      console.warn('Firestore toggleFavorite fallback:', err);
      const updated = profiles.map(p => 
        p.id === profileId ? { ...p, favorite: !currentVal, updatedAt: Date.now() } : p
      );
      saveToLocalDemo(updated);
    }
  }, [userId, isDemoUser, profiles, saveToLocalDemo]);

  // Seed sample profiles if directory is empty or requested
  const seedSampleProfiles = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const now = Date.now();
      if (isDemoUser) {
        const seeded: ManagedProfile[] = SAMPLE_PROFILES.map((sample, idx) => ({
          ...sample,
          id: `profile-seed-${now}-${idx}`,
          userId,
          createdAt: now - idx * 3600000,
          updatedAt: now - idx * 1800000
        }));
        saveToLocalDemo([...seeded, ...profiles]);
        return;
      }

      const colRef = collection(db, 'users', userId, 'profiles');
      for (const sample of SAMPLE_PROFILES) {
        await addDoc(colRef, {
          ...sample,
          userId,
          createdAt: now,
          updatedAt: now
        });
      }
    } catch (err: any) {
      console.error('Error seeding profiles:', err);
      setError(err.message || 'Failed to seed sample profiles');
    } finally {
      setLoading(false);
    }
  }, [userId, isDemoUser, profiles, saveToLocalDemo]);

  return {
    profiles,
    loading,
    error,
    lastSyncTime,
    isLive,
    addProfile,
    updateProfile,
    deleteProfile,
    toggleFavorite,
    seedSampleProfiles
  };
}
