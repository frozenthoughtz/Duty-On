import React, { useState } from 'react';
import { 
  User, 
  LogOut, 
  Plus, 
  Search, 
  ShieldCheck, 
  Download, 
  Sparkles, 
  Layers, 
  UserCheck, 
  BarChart3,
  Wifi,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/profileHelpers';

interface NavbarProps {
  activeTab: 'directory' | 'my-profile' | 'insights';
  onTabChange: (tab: 'directory' | 'my-profile' | 'insights') => void;
  onOpenCreateModal: () => void;
  profileCount: number;
  isLive: boolean;
  onExport: () => void;
  onSeedData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenCreateModal,
  profileCount,
  isLive,
  onExport,
  onSeedData
}) => {
  const { currentUser, userProfile, isAnonymous, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayName = userProfile?.displayName || currentUser?.displayName || (isAnonymous ? 'Guest User' : 'Member');
  const userEmail = currentUser?.email || (isAnonymous ? 'Temporary session' : '');
  const avatarColor = userProfile?.avatarColor || '#3B82F6';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Connection Status */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('directory')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-lg">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white tracking-tight">Profiles<span className="text-cyan-400">Hub</span></span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Real-time
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Firebase Firestore</span>
                  <span>•</span>
                  <span>{profileCount} {profileCount === 1 ? 'profile' : 'profiles'}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 ml-4 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              <button
                onClick={() => onTabChange('directory')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'directory'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Directory
              </button>
              <button
                onClick={() => onTabChange('my-profile')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'my-profile'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                My Profile
              </button>
              <button
                onClick={() => onTabChange('insights')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'insights'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Insights
              </button>
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Add Profile */}
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Add Profile</span>
            </button>

            {/* Profile / Account Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ring-2 ring-slate-700"
                  style={{ backgroundColor: avatarColor }}
                >
                  {getInitials(displayName)}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight">{displayName}</div>
                  <div className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
                    {isAnonymous ? 'Guest' : userEmail}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl p-2 z-50 text-slate-200">
                    <div className="px-3 py-2.5 border-b border-slate-700/80 mb-1">
                      <div className="text-xs font-semibold text-white truncate">{displayName}</div>
                      <div className="text-[11px] text-slate-400 truncate">{userEmail}</div>
                      {isAnonymous && (
                        <div className="mt-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-medium">
                          Guest Session active
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          onTabChange('my-profile');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4 text-cyan-400" />
                        Edit My Personal Profile
                      </button>
                      <button
                        onClick={() => {
                          onSeedData();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Load Sample Directory Data
                      </button>
                      <button
                        onClick={() => {
                          onExport();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <Download className="w-4 h-4 text-emerald-400" />
                        Export Directory (JSON / CSV)
                      </button>
                    </div>

                    <div className="border-t border-slate-700/80 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden border-t border-slate-800 px-4 py-2 flex items-center justify-around bg-slate-900">
        <button
          onClick={() => onTabChange('directory')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${
            activeTab === 'directory' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          Directory
        </button>
        <button
          onClick={() => onTabChange('my-profile')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${
            activeTab === 'my-profile' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400'
          }`}
        >
          <User className="w-4 h-4" />
          My Profile
        </button>
        <button
          onClick={() => onTabChange('insights')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${
            activeTab === 'insights' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Insights
        </button>
      </div>
    </header>
  );
};
