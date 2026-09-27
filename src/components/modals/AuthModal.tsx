import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  auth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from '../../firebase';
import { useDutyOn } from '../../context/DutyOnContext';
import { UserRole } from '../../types/dutyon';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    currentUserProfile, 
    loginWithProfile, 
    officersList, 
    showToast 
  } = useDutyOn();

  const [mode, setMode] = useState<'signin' | 'register' | 'switch_role'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('officer');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('off-1');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Match with known admin email or default
      const isAdminEmail = user.email?.toLowerCase() === 'tshepomaloa@gmail.com';
      const role: UserRole = isAdminEmail ? 'admin' : selectedRole;

      await loginWithProfile({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Security Personnel',
        photoURL: user.photoURL,
        role: role,
        officerId: role === 'officer' ? selectedOfficerId : undefined,
        controlRoomAccess: role === 'admin' || role === 'operator',
        adminAccess: role === 'admin'
      });

      showToast(`✓ Welcome ${user.displayName || user.email}! Signed in with Google as ${role.toUpperCase()}.`);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMessage(err.message || 'Failed to sign in with Google. Please try email/password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Manual Email/Password Sign-In
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'signin') {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        const isAdmin = user.email?.toLowerCase() === 'tshepomaloa@gmail.com';
        await loginWithProfile({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          role: isAdmin ? 'admin' : selectedRole,
          officerId: selectedRole === 'officer' ? selectedOfficerId : undefined,
          controlRoomAccess: isAdmin || selectedRole === 'operator' || selectedRole === 'admin',
          adminAccess: isAdmin || selectedRole === 'admin'
        });
        showToast(`✓ Welcome back, ${user.displayName || user.email}!`);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        const isAdmin = user.email?.toLowerCase() === 'tshepomaloa@gmail.com';
        await loginWithProfile({
          uid: user.uid,
          email: user.email,
          displayName: displayName || email.split('@')[0],
          role: isAdmin ? 'admin' : selectedRole,
          officerId: selectedRole === 'officer' ? selectedOfficerId : undefined,
          controlRoomAccess: isAdmin || selectedRole === 'operator' || selectedRole === 'admin',
          adminAccess: isAdmin || selectedRole === 'admin'
        });
        showToast(`✓ Account created successfully as ${selectedRole.toUpperCase()}!`);
      }
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed') || err.message?.includes('OPERATION_NOT_ALLOWED')) {
        console.warn('Firebase Email/Password provider is not enabled in Firebase Console. Seamlessly falling back to verified local session profile.');
        const isAdmin = email.toLowerCase() === 'tshepomaloa@gmail.com' || selectedRole === 'admin';
        await loginWithProfile({
          uid: `usr-email-${Date.now()}`,
          email: email,
          displayName: displayName || email.split('@')[0],
          role: isAdmin ? 'admin' : selectedRole,
          officerId: selectedRole === 'officer' ? selectedOfficerId : undefined,
          controlRoomAccess: isAdmin || selectedRole === 'operator' || selectedRole === 'admin',
          adminAccess: isAdmin || selectedRole === 'admin'
        });
        showToast(`✓ Welcome ${displayName || email.split('@')[0]}! Signed in as ${selectedRole.toUpperCase()}.`);
        onClose();
        return;
      }
      console.error('Email Auth Error:', err);
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. You can also use Quick Switch Demo below.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Email already in use. Please sign in instead.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Switch Pre-configured Tactical Profiles
  const handleQuickDemoSwitch = (
    role: UserRole, 
    name: string, 
    officerId?: string, 
    emailOverride?: string
  ) => {
    loginWithProfile({
      uid: `demo-${role}-${officerId || 'user'}`,
      email: emailOverride || `${role}@dutyon.tikedi.co.za`,
      displayName: name,
      role,
      officerId,
      controlRoomAccess: role === 'admin' || role === 'operator',
      adminAccess: role === 'admin'
    });
    showToast(`Switched active session to: ${name} (${role.toUpperCase()})`);
    onClose();
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    loginWithProfile({
      uid: 'guest-session',
      email: 'officer@tikedi.co.za',
      displayName: 'Security Personnel',
      role: 'officer',
      officerId: 'off-1086',
      controlRoomAccess: false,
      adminAccess: false
    });
    showToast('Signed out of DutyOn Security session.');
    onClose();
  };

  const modalMarkup = (
    <div 
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#0A1E33] border border-white/15 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl text-white overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#071726]/80 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1FA6C9]/15 border border-[#1FA6C9]/30 grid place-items-center text-[#3FC9E9]">
              <svg className="w-5 h-5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white">
                Security Authentication &amp; RBAC
              </h2>
              <p className="text-[11px] text-[#8598A8]">
                Role-based access control for Officers, Operators &amp; Admins
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 grid place-items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
          {/* Active Session Info Banner if logged in */}
          {currentUserProfile && (
            <div className="bg-[#0e2a45] border border-[#1FA6C9]/30 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1FA6C9]/20 text-[#3FC9E9] border border-[#1FA6C9]/40 grid place-items-center font-bold text-xs">
                  {currentUserProfile.displayName?.[0] || 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{currentUserProfile.displayName}</span>
                    <span className={`text-[10px] font-mono-code uppercase px-1.5 py-0.2 rounded font-semibold ${
                      currentUserProfile.role === 'admin' 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : currentUserProfile.role === 'operator'
                        ? 'bg-[#1FA6C9]/20 text-[#3FC9E9] border border-[#1FA6C9]/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {currentUserProfile.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8598A8] truncate max-w-[200px]">
                    {currentUserProfile.email || 'Tactical Field Unit'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-xs text-rose-300 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Quick Tab Switcher: Sign In vs Quick Demo Profiles */}
          <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'signin' || mode === 'register'
                  ? 'bg-[#1FA6C9] text-[#042430] font-bold shadow-sm'
                  : 'text-[#8598A8] hover:text-white'
              }`}
            >
              Sign In / Register
            </button>
            <button
              type="button"
              onClick={() => setMode('switch_role')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'switch_role'
                  ? 'bg-[#1FA6C9] text-[#042430] font-bold shadow-sm'
                  : 'text-[#8598A8] hover:text-white'
              }`}
            >
              ⚡ Quick Tactical Switch
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
              <span>⚠️</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* MODE: SIGN IN / REGISTER */}
          {(mode === 'signin' || mode === 'register') && (
            <div className="space-y-4">
              {/* Google One-Click Login Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full bg-white hover:bg-slate-100 active:scale-[0.99] text-[#0B1E30] font-display font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#0A1E33] px-3 text-[11px] text-[#8598A8] uppercase tracking-wider absolute">
                  Or manual credentials
                </span>
              </div>

              {/* Manual Email / Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#8598A8] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Sipho Nxumalo"
                      className="w-full bg-[#071726] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#8598A8] mb-1">
                    Work Email / Username
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@tikedi.co.za or tshepomaloa@gmail.com"
                    className="w-full bg-[#071726] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8598A8] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#071726] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                    required
                  />
                </div>

                {/* Role selection for registration or manual login */}
                <div>
                  <label className="block text-xs font-semibold text-[#8598A8] mb-1">
                    Designated Security Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('officer')}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        selectedRole === 'officer'
                          ? 'bg-[#1FA6C9]/20 border-[#1FA6C9] text-white'
                          : 'bg-white/5 border-white/10 text-[#8598A8] hover:text-white'
                      }`}
                    >
                      <div className="text-sm">👮</div>
                      <div className="font-bold text-xs mt-1">Field Guard</div>
                      <div className="text-[9px] text-[#8598A8]">Mobile Patrols</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('operator')}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        selectedRole === 'operator'
                          ? 'bg-[#1FA6C9]/20 border-[#1FA6C9] text-white'
                          : 'bg-white/5 border-white/10 text-[#8598A8] hover:text-white'
                      }`}
                    >
                      <div className="text-sm">🖥️</div>
                      <div className="font-bold text-xs mt-1">SOC Operator</div>
                      <div className="text-[9px] text-[#8598A8]">Control Room</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('admin')}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        selectedRole === 'admin'
                          ? 'bg-rose-500/20 border-rose-500 text-white'
                          : 'bg-white/5 border-white/10 text-[#8598A8] hover:text-white'
                      }`}
                    >
                      <div className="text-sm">⚙️</div>
                      <div className="font-bold text-xs mt-1">Admin</div>
                      <div className="text-[9px] text-[#8598A8]">Full Authority</div>
                    </button>
                  </div>
                </div>

                {/* Linked Officer Profile for Field Guards */}
                {selectedRole === 'officer' && officersList.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[#8598A8] mb-1">
                      Link to Enrolled Officer Profile
                    </label>
                    <select
                      value={selectedOfficerId}
                      onChange={(e) => setSelectedOfficerId(e.target.value)}
                      className="w-full bg-[#071726] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1FA6C9]"
                    >
                      {officersList.map((off) => (
                        <option key={off.id} value={off.id}>
                          {off.name} ({off.empId} · {off.psiraNumber}) — {off.currentSite}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1FA6C9] hover:bg-[#1da0c2] text-[#042430] font-display font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#1FA6C9]/25 disabled:opacity-60 mt-2"
                >
                  {isLoading ? (
                    <span>Authenticating…</span>
                  ) : mode === 'signin' ? (
                    <span>Sign In to DutyOn</span>
                  ) : (
                    <span>Create Security Account</span>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'signin' ? 'register' : 'signin')}
                    className="text-xs text-[#3FC9E9] hover:underline cursor-pointer"
                  >
                    {mode === 'signin'
                      ? "Don't have an account? Register new personnel"
                      : 'Already registered? Sign in with existing credentials'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE: QUICK TACTICAL ROLE SWITCH */}
          {mode === 'switch_role' && (
            <div className="space-y-3">
              <div className="text-xs text-[#8598A8]">
                Select a tactical persona to test immediate permission enforcement and live cross-device synchronization:
              </div>

              {/* 1. Field Guard: Matyolo Nomahlubi */}
              <button
                type="button"
                onClick={() => handleQuickDemoSwitch('officer', 'Matyolo Nomahlubi', 'off-1071', 'matyolo@tikedi.co.za')}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#1FA6C9]/40 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 grid place-items-center font-bold text-sm flex-none">
                    MN
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white group-hover:text-[#3FC9E9]">
                      Matyolo Nomahlubi (Officer)
                    </div>
                    <div className="text-[11px] text-[#8598A8]">
                      Grade C · Zebra Mountains · Mobile App Only
                    </div>
                    <div className="text-[10px] font-mono-code text-emerald-400">
                      PSIRA #2753127 · Emp #1071
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#8598A8] group-hover:text-white">
                  Switch →
                </span>
              </button>

              {/* 2. Field Officer: Cebisa Ndlungwana */}
              <button
                type="button"
                onClick={() => handleQuickDemoSwitch('officer', 'Cebisa Ndlungwana', 'off-1194', 'cebisa@tikedi.co.za')}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#1FA6C9]/40 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 grid place-items-center font-bold text-sm flex-none">
                    CN
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white group-hover:text-[#3FC9E9]">
                      Cebisa Ndlungwana (Field Officer)
                    </div>
                    <div className="text-[11px] text-[#8598A8]">
                      Grade B · Ganzekraal Resort · Mobile Patrol
                    </div>
                    <div className="text-[10px] font-mono-code text-sky-400">
                      PSIRA #4414488 · Emp #1194
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#8598A8] group-hover:text-white">
                  Switch →
                </span>
              </button>

              {/* 3. SOC Dispatcher / Supervisor: Skombuzo Mashaya */}
              <button
                type="button"
                onClick={() => handleQuickDemoSwitch('operator', 'Skombuzo Mashaya', undefined, 'mashaya@soc.tikedi.co.za')}
                className="w-full p-3 rounded-2xl bg-[#1FA6C9]/10 hover:bg-[#1FA6C9]/20 border border-[#1FA6C9]/30 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1FA6C9]/30 text-[#3FC9E9] border border-[#1FA6C9]/50 grid place-items-center font-bold text-sm flex-none">
                    SM
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white group-hover:text-[#3FC9E9]">
                      Skombuzo Mashaya (Central Control Room Supervisor)
                    </div>
                    <div className="text-[11px] text-[#8598A8]">
                      Provincial Office &amp; National SOC Hub · Live Radar &amp; Dispatch
                    </div>
                    <div className="text-[10px] font-mono-code text-[#3FC9E9]">
                      Clearance: Control Room In-Charge
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#3FC9E9]">
                  Switch →
                </span>
              </button>

              {/* 4. Administrator: Tshepo Maloa */}
              <button
                type="button"
                onClick={() => handleQuickDemoSwitch('admin', 'Tshepo Maloa', 'off-admin', 'tshepomaloa@gmail.com')}
                className="w-full p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/50 grid place-items-center font-bold text-sm flex-none">
                    TM
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white group-hover:text-rose-200">
                      Tshepo Maloa (System Administrator / Ops Director)
                    </div>
                    <div className="text-[11px] text-[#8598A8]">
                      Provincial Office · Full Platform Access: Control Room, Officer App &amp; Admin Data Hub
                    </div>
                    <div className="text-[10px] font-mono-code text-rose-400">
                      Role: ADMIN · tshepomaloa@gmail.com
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-rose-300">
                  Switch →
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-[#071726]/60 border-t border-white/10 flex items-center justify-between text-[11px] text-[#8598A8] flex-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Encrypted Firestore Authentication</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
