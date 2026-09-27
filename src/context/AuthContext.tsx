import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db,
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  type User
} from '../firebase';
import { UserPersonalProfile } from '../types/profile';

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  isAnonymous: boolean;
  isDemo?: boolean;
}

interface AuthContextType {
  currentUser: AppUser | null;
  userProfile: UserPersonalProfile | null;
  loading: boolean;
  isAnonymous: boolean;
  isDemoSession: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  signInGuest: (customName?: string, customEmail?: string) => Promise<void>;
  startDemoSession: (name?: string, email?: string) => void;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePersonalProfile: (data: Partial<UserPersonalProfile>) => Promise<void>;
  authError: string | null;
  authErrorCode: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'profiles_hub_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserPersonalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);

  // Sync user profile from Firestore or LocalStorage
  const syncOrCreateUserProfile = async (user: AppUser | User) => {
    const isDemo = 'isDemo' in user && user.isDemo;

    if (isDemo || user.uid.startsWith('demo-')) {
      const localProfileKey = `user_profile_${user.uid}`;
      const saved = localStorage.getItem(localProfileKey);
      if (saved) {
        try {
          setUserProfile(JSON.parse(saved));
          return;
        } catch {
          // recreate
        }
      }

      const initialProfile: UserPersonalProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Tshepo Humphrey Maloa',
        email: user.email || 'tshepomaloa@yahoo.com',
        headline: 'Personal & Professional Profile Owner',
        bio: 'Managing my personal contacts, emergency medical contacts, family, and professional network.',
        phone: '+1 (555) 019-2831',
        location: 'Johannesburg, South Africa',
        company: 'Profile Manager',
        role: 'Account Owner',
        avatarColor: '#06B6D4',
        skills: ['Communications', 'Contact Management', 'Operations', 'Leadership'],
        interests: ['Technology', 'Family', 'Mentorship', 'Finance'],
        status: 'available',
        statusMessage: 'Profile active and available',
        socialLinks: {
          linkedin: '',
          github: '',
          twitter: '',
          website: ''
        },
        preferredContactMethod: 'email',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      localStorage.setItem(localProfileKey, JSON.stringify(initialProfile));
      setUserProfile(initialProfile);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        setUserProfile(snapshot.data() as UserPersonalProfile);
      } else {
        const initialProfile: UserPersonalProfile = {
          uid: user.uid,
          displayName: user.displayName || (user.isAnonymous ? 'Guest User' : user.email?.split('@')[0] || 'Member'),
          email: user.email || 'user@preview.local',
          headline: 'Professional & Personal Profile Owner',
          bio: 'Managing my personal contacts, family, career network, and personal records securely.',
          phone: '+1 (555) 019-2831',
          location: 'San Francisco, CA',
          company: 'Independent Professional',
          role: 'Profile Manager',
          avatarColor: '#3B82F6',
          skills: ['Communication', 'Network Management', 'Operations', 'Leadership'],
          interests: ['Technology', 'Health', 'Mentorship', 'Finance'],
          status: 'available',
          statusMessage: 'Active and reachable',
          socialLinks: {
            linkedin: '',
            github: '',
            twitter: '',
            website: ''
          },
          preferredContactMethod: 'email',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        await setDoc(userRef, {
          ...initialProfile,
          serverTimestamp: serverTimestamp()
        });

        setUserProfile(initialProfile);
      }
    } catch (err: any) {
      console.warn('Firestore profile sync fallback:', err);
      // Fallback to local profile copy if Firestore rule or network prevents reading
      const fallbackProfile: UserPersonalProfile = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Member',
        email: user.email || 'user@preview.local',
        headline: 'Profile Manager Owner',
        bio: 'Managing my contacts and personal identity.',
        phone: '+1 (555) 019-2831',
        location: 'Local Workspace',
        company: 'Personal Profile Hub',
        role: 'Account Owner',
        avatarColor: '#3B82F6',
        skills: ['Communication', 'Network Management'],
        interests: ['Technology', 'Health'],
        status: 'available',
        statusMessage: 'Active',
        socialLinks: {},
        preferredContactMethod: 'email',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setUserProfile(fallbackProfile);
    }
  };

  // Restore saved demo session or listen to Firebase Auth
  useEffect(() => {
    // 1. Check if user already had an active demo session saved
    const savedDemo = localStorage.getItem(DEMO_USER_KEY);
    if (savedDemo) {
      try {
        const parsed: AppUser = JSON.parse(savedDemo);
        setCurrentUser(parsed);
        syncOrCreateUserProfile(parsed);
        setLoading(false);
      } catch {
        localStorage.removeItem(DEMO_USER_KEY);
      }
    }

    // 2. Listen to real Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Clear demo user if real user logs in
        localStorage.removeItem(DEMO_USER_KEY);
        const mappedUser: AppUser = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          isAnonymous: user.isAnonymous,
          isDemo: false
        };
        setCurrentUser(mappedUser);
        await syncOrCreateUserProfile(user);
        setLoading(false);
      } else {
        // If not authenticated via Firebase, check if demo session exists
        const currentSavedDemo = localStorage.getItem(DEMO_USER_KEY);
        if (!currentSavedDemo) {
          setCurrentUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    setAuthErrorCode(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        localStorage.removeItem(DEMO_USER_KEY);
        const mappedUser: AppUser = {
          uid: res.user.uid,
          displayName: res.user.displayName,
          email: res.user.email,
          isAnonymous: false,
          isDemo: false
        };
        setCurrentUser(mappedUser);
        await syncOrCreateUserProfile(res.user);
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setAuthErrorCode(err.code || 'GOOGLE_SIGNIN_ERROR');
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in cancelled (popup was closed).');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked by your browser. Please allow popups or use Demo Mode.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError('This domain is not in Firebase authorized domains list. Try Instant Demo mode.');
      } else {
        setAuthError(err.message || 'Google Sign-In failed.');
      }
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    setAuthErrorCode(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setAuthErrorCode(err.code);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('OPERATION_NOT_ALLOWED') || err.message?.includes('operation-not-allowed')) {
        console.warn('Email/Password provider is not enabled in Firebase Console. Seamlessly starting session with entered email:', email);
        startDemoSession(email.split('@')[0], email);
        return;
      }
      let message = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again in a few moments.';
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    setAuthError(null);
    setAuthErrorCode(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName });
        await syncOrCreateUserProfile({ ...res.user, displayName });
      }
    } catch (err: any) {
      setAuthErrorCode(err.code);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('OPERATION_NOT_ALLOWED') || err.message?.includes('operation-not-allowed')) {
        console.warn('Email/Password authentication disabled in Firebase console. Seamlessly starting session with entered email:', email);
        startDemoSession(displayName || email.split('@')[0], email);
        return;
      }
      let message = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  const startDemoSession = (name?: string, email?: string) => {
    const dName = name?.trim() || 'Tshepo Humphrey Maloa';
    const dEmail = email?.trim() || 'tshepomaloa@yahoo.com';
    
    // Create deterministic ID based on user name/email
    const demoUser: AppUser = {
      uid: 'demo-' + (email ? encodeURIComponent(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) : 'guest-user'),
      displayName: dName,
      email: dEmail,
      isAnonymous: true,
      isDemo: true
    };

    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    setCurrentUser(demoUser);
    syncOrCreateUserProfile(demoUser);
    setAuthError(null);
    setAuthErrorCode(null);
  };

  const signInGuest = async (customName?: string, customEmail?: string) => {
    setAuthError(null);
    setAuthErrorCode(null);
    try {
      // Attempt real Firebase anonymous authentication first
      const res = await signInAnonymously(auth);
      if (res.user && customName) {
        await updateProfile(res.user, { displayName: customName });
        await syncOrCreateUserProfile({ ...res.user, displayName: customName });
      }
    } catch (err: any) {
      console.warn('Firebase Anonymous Auth unavailable, launching instant demo session:', err);
      // Seamlessly fallback to guaranteed demo session so user is never blocked!
      startDemoSession(customName || 'Guest User', customEmail || 'guest@preview.local');
    }
  };

  const signOut = async () => {
    setAuthError(null);
    setAuthErrorCode(null);
    localStorage.removeItem(DEMO_USER_KEY);
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setAuthError(null);
    setAuthErrorCode(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setAuthErrorCode(err.code);
      const msg = err.code === 'auth/operation-not-allowed'
        ? 'Email/Password reset is disabled in Firebase Console.'
        : 'Could not send reset link: ' + err.message;
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const updatePersonalProfile = async (data: Partial<UserPersonalProfile>) => {
    if (!currentUser) return;
    try {
      const updated = {
        ...userProfile,
        ...data,
        updatedAt: Date.now()
      };

      if (currentUser.isDemo || currentUser.uid.startsWith('demo-')) {
        localStorage.setItem(`user_profile_${currentUser.uid}`, JSON.stringify(updated));
        setUserProfile(updated as UserPersonalProfile);
        if (data.displayName) {
          const updatedUser: AppUser = {
            ...currentUser,
            displayName: data.displayName
          };
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
        }
        return;
      }

      // Real Firebase Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, updated, { merge: true });
      setUserProfile(updated as UserPersonalProfile);

      if (data.displayName && data.displayName !== currentUser.displayName && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.displayName });
      }
    } catch (err: any) {
      console.error('Failed to update personal profile:', err);
      // Even if Firestore update fails, preserve local state so user doesn't lose work
      if (userProfile) {
        setUserProfile({ ...userProfile, ...data, updatedAt: Date.now() } as UserPersonalProfile);
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAnonymous: currentUser?.isAnonymous ?? false,
        isDemoSession: !!(currentUser?.isDemo || currentUser?.uid.startsWith('demo-')),
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInGuest,
        startDemoSession,
        signOut,
        sendPasswordReset,
        updatePersonalProfile,
        authError,
        authErrorCode,
        clearAuthError: () => {
          setAuthError(null);
          setAuthErrorCode(null);
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
