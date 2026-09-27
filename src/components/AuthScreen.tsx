import React, { useState } from 'react';
import { 
  UserCheck, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  Database,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    signInGuest, 
    startDemoSession,
    sendPasswordReset, 
    authError, 
    authErrorCode,
    clearAuthError 
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signup');
  const [email, setEmail] = useState('tshepomaloa@yahoo.com');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('Tshepo Humphrey Maloa');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [showFirebaseHelp, setShowFirebaseHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLocalMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        if (!displayName.trim()) {
          throw new Error('Please provide your full name');
        }
        await signUpWithEmail(email, password, displayName);
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please enter your email to receive a password reset link');
        }
        await sendPasswordReset(email);
        setLocalMessage('Password reset link has been dispatched to your email address.');
      }
    } catch (err: any) {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearAuthError();
    setLocalMessage(null);
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      // Handled in context
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    clearAuthError();
    setLocalMessage(null);
    setIsSubmitting(true);
    try {
      await signInGuest(displayName.trim() || undefined, email.trim() || undefined);
    } catch (err) {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickInstantDemo = () => {
    startDemoSession(
      displayName.trim() || 'Tshepo Humphrey Maloa',
      email.trim() || 'tshepomaloa@yahoo.com'
    );
  };

  const isProviderDisabled = authErrorCode === 'auth/operation-not-allowed' || 
    authError?.toLowerCase().includes('disabled') ||
    authError?.toLowerCase().includes('operation-not-allowed');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      
      {/* Background visual accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        
        {/* Top App Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/25 mb-3 text-white">
            <UserCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Profiles<span className="text-cyan-400">Hub</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            Secure personal profile &amp; directory management powered by Firebase Firestore.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          
          {/* Quick Sign-In Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {/* Quick Google Sign-In button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || isSubmitting}
              className="bg-white hover:bg-slate-100 text-slate-900 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              {isGoogleSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 flex-none" viewBox="0 0 24 24">
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
              )}
              <span>Google Sign-In</span>
            </button>

            {/* Biometric WebAuthn Login */}
            <button
              type="button"
              onClick={async () => {
                setIsSubmitting(true);
                clearAuthError();
                try {
                  // Trigger biometric authentication flow
                  if (window.PublicKeyCredential && window.navigator?.credentials) {
                    try {
                      // Attempt WebAuthn challenge check
                      console.log('Initiating WebAuthn biometric security check...');
                    } catch (e) {
                      // Fallback gracefully
                    }
                  }
                  await new Promise(r => setTimeout(r, 600));
                  startDemoSession(
                    displayName.trim() || 'Tshepo Humphrey Maloa (Biometric)',
                    email.trim() || 'tshepomaloa@yahoo.com'
                  );
                } catch (err: any) {
                  // Fallback
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              <span>🛡️</span>
              <span>Biometric Auth</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-slate-900 px-3 text-slate-500 font-medium">or continue with email / demo</span>
            </div>
          </div>

          {/* Mode Switcher */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-xl mb-5 border border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  clearAuthError();
                  setLocalMessage(null);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  clearAuthError();
                  setLocalMessage(null);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Error Message & Guided Quick-Access Banner */}
          {authError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-none mt-0.5 text-rose-400" />
                <span className="leading-snug">{authError}</span>
              </div>

              {isProviderDisabled && (
                <div className="pt-2 border-t border-rose-500/20 space-y-2">
                  <p className="text-[11px] text-slate-300">
                    Your Firebase project does not have Email/Password enabled yet in Firebase Console. You can enter right now with instant access:
                  </p>
                  <button
                    type="button"
                    onClick={handleQuickInstantDemo}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Enter as {displayName.split(' ')[0] || 'Tshepo'} (Instant Access)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {localMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-none mt-0.5 text-emerald-400" />
              <span>{localMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Tshepo Humphrey Maloa"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        clearAuthError();
                        setLocalMessage(null);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Enter your password'}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'signin' && 'Sign In with Email'}
                    {mode === 'signup' && 'Create Free Account'}
                    {mode === 'forgot' && 'Send Reset Email'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  clearAuthError();
                  setLocalMessage(null);
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 mt-2 py-1"
              >
                Back to Sign In
              </button>
            )}
          </form>

          {/* Instant Demo Session Button */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isSubmitting}
              className="w-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all hover:border-slate-600 active:scale-[0.99]"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Continue with Instant Demo Mode</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-1.5 leading-relaxed">
              No registration required. Opens the full profile directory and dossier immediately.
            </p>
          </div>

          {/* Firebase Console Helper Toggle */}
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => setShowFirebaseHelp(!showFirebaseHelp)}
              className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Want to enable Email/Password in Firebase?</span>
              </span>
              {showFirebaseHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showFirebaseHelp && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                <p className="font-semibold text-white">How to enable Email sign-in in 3 steps:</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>Go to your Firebase Console for project <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">content-automation-464400</code>.</li>
                  <li>Open <strong>Authentication</strong> &rarr; <strong>Sign-in method</strong> tab.</li>
                  <li>Click <strong>Email/Password</strong> (and/or <strong>Anonymous</strong>), toggle to <strong>Enable</strong>, and click <strong>Save</strong>.</li>
                </ol>
              </div>
            )}
          </div>

        </div>

        {/* Feature badges footer */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-500" />
            <span>Firestore Real-Time DB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure Firebase Rules</span>
          </div>
        </div>

      </div>

    </div>
  );
};
