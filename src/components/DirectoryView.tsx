import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Star, 
  AlertTriangle, 
  Grid, 
  List, 
  ArrowUpDown, 
  Sparkles, 
  X,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Tag
} from 'lucide-react';
import { ManagedProfile, ProfileCategory } from '../types/profile';
import { ProfileCard } from './ProfileCard';
import { CATEGORIES, CATEGORY_STYLES, getInitials } from '../utils/profileHelpers';

interface DirectoryViewProps {
  profiles: ManagedProfile[];
  loading: boolean;
  onOpenCreate: () => void;
  onSelectProfile: (profile: ManagedProfile) => void;
  onEditProfile: (profile: ManagedProfile) => void;
  onDeleteProfile: (id: string) => void;
  onToggleFavorite: (id: string, currentVal: boolean) => void;
  onSeedData: () => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  profiles,
  loading,
  onOpenCreate,
  onSelectProfile,
  onEditProfile,
  onDeleteProfile,
  onToggleFavorite,
  onSeedData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProfileCategory | 'All'>('All');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyEmergency, setOnlyEmergency] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'updatedAt' | 'name' | 'category'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter & sort logic
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = profile.fullName.toLowerCase().includes(query) || 
          (profile.preferredName && profile.preferredName.toLowerCase().includes(query));
        const matchesHeadline = profile.headline?.toLowerCase().includes(query);
        const matchesCompany = profile.company?.toLowerCase().includes(query);
        const matchesEmail = profile.email?.toLowerCase().includes(query);
        const matchesRole = profile.role?.toLowerCase().includes(query);
        const matchesTags = profile.tags?.some(t => t.toLowerCase().includes(query));

        if (!matchesName && !matchesHeadline && !matchesCompany && !matchesEmail && !matchesRole && !matchesTags) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'All' && profile.category !== selectedCategory) {
        return false;
      }

      // Favorites
      if (onlyFavorites && !profile.favorite) {
        return false;
      }

      // Emergency
      if (onlyEmergency && !profile.emergencyContact) {
        return false;
      }

      // Tag filter
      if (selectedTag && (!profile.tags || !profile.tags.includes(selectedTag))) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        const comp = a.fullName.localeCompare(b.fullName);
        return sortOrder === 'asc' ? comp : -comp;
      } else if (sortBy === 'category') {
        const comp = a.category.localeCompare(b.category);
        return sortOrder === 'asc' ? comp : -comp;
      } else {
        // updatedAt
        const diff = (b.updatedAt || 0) - (a.updatedAt || 0);
        return sortOrder === 'asc' ? -diff : diff;
      }
    });
  }, [profiles, searchQuery, selectedCategory, onlyFavorites, onlyEmergency, selectedTag, sortBy, sortOrder]);

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'All' || onlyFavorites || onlyEmergency || selectedTag !== null;

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setOnlyFavorites(false);
    setOnlyEmergency(false);
    setSelectedTag(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Banner & Search Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Personal Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time profiles database. Changes automatically sync to all devices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {profiles.length === 0 && !loading && (
            <button
              onClick={onSeedData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Load Sample Data
            </button>
          )}

          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            Add Profile
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 mb-6 shadow-xl space-y-4">
        
        {/* Search Input & View Toggles */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, email, role, or keywords..."
              className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3 py-2 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white focus:outline-none text-xs pr-1"
              >
                <option value="updatedAt" className="bg-slate-900">Recently Updated</option>
                <option value="name" className="bg-slate-900">Alphabetical (Name)</option>
                <option value="category" className="bg-slate-900">Category</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 text-cyan-400"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>

            {/* Grid vs Table View Mode */}
            <div className="flex items-center bg-slate-950/70 border border-slate-700/80 rounded-2xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === 'grid' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === 'table' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills & Quick Filter Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750'
              }`}
            >
              All ({profiles.length})
            </button>
            {CATEGORIES.map(cat => {
              const count = profiles.filter(p => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-colors ${
                onlyFavorites 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              Favorites
            </button>

            <button
              onClick={() => setOnlyEmergency(!onlyEmergency)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-colors ${
                onlyEmergency 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Emergency
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-slate-400 hover:text-rose-400 underline underline-offset-4 pl-1"
              >
                Reset
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Profiles Content Area */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-slate-400">Loading your profile database from Firestore...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {hasActiveFilters ? 'No profiles match your filters' : 'No profiles found in your database'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            {hasActiveFilters 
              ? 'Try relaxing your search terms or category filters to see more results.'
              : 'Add your first personal contact, emergency liaison, or family member to sync in real-time.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Clear all filters
              </button>
            ) : (
              <>
                <button
                  onClick={onSeedData}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Load Sample Profiles
                </button>
                <button
                  onClick={onOpenCreate}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Profile
                </button>
              </>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onSelect={onSelectProfile}
              onEdit={onEditProfile}
              onDelete={onDeleteProfile}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/40">
                  <th className="py-3.5 px-4 font-bold">Profile</th>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-4 font-bold">Relationship</th>
                  <th className="py-3.5 px-4 font-bold">Contact</th>
                  <th className="py-3.5 px-4 font-bold">Company / Role</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProfiles.map((profile) => {
                  const catStyle = CATEGORY_STYLES[profile.category] || CATEGORY_STYLES.Personal;
                  return (
                    <tr 
                      key={profile.id}
                      onClick={() => onSelectProfile(profile)}
                      className="hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white flex-none"
                            style={{ backgroundColor: profile.avatarColor || '#3B82F6' }}
                          >
                            {getInitials(profile.fullName)}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{profile.fullName}</span>
                              {profile.favorite && (
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-none" />
                              )}
                              {profile.emergencyContact && (
                                <AlertTriangle className="w-3 h-3 text-rose-400 flex-none" />
                              )}
                            </div>
                            {profile.headline && (
                              <div className="text-[11px] text-slate-400 truncate max-w-xs">
                                {profile.headline}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          {profile.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {profile.relationship || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-300">{profile.email || profile.phone || '—'}</div>
                        {profile.location && (
                          <div className="text-[10px] text-slate-500">{profile.location}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {profile.company || profile.role ? (
                          <div>
                            <div className="text-white font-medium">{profile.company || '—'}</div>
                            <div className="text-[10px] text-slate-400">{profile.role || ''}</div>
                          </div>
                        ) : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onToggleFavorite(profile.id, profile.favorite)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              profile.favorite ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${profile.favorite ? 'fill-amber-400' : ''}`} />
                          </button>
                          <button
                            onClick={() => onEditProfile(profile)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${profile.fullName}?`)) {
                                onDeleteProfile(profile.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Directory Count Footer */}
      {!loading && filteredProfiles.length > 0 && (
        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {filteredProfiles.length} of {profiles.length} profiles
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Firestore live stream connected</span>
          </div>
        </div>
      )}

    </div>
  );
};
