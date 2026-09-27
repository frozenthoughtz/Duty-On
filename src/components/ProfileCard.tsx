import React, { useState } from 'react';
import { 
  Star, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  ExternalLink, 
  MoreVertical, 
  AlertTriangle, 
  Edit3, 
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { ManagedProfile } from '../types/profile';
import { CATEGORY_STYLES, getInitials } from '../utils/profileHelpers';

interface ProfileCardProps {
  profile: ManagedProfile;
  onSelect: (profile: ManagedProfile) => void;
  onEdit: (profile: ManagedProfile) => void;
  onDelete: (profileId: string) => void;
  onToggleFavorite: (profileId: string, currentVal: boolean) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onSelect,
  onEdit,
  onDelete,
  onToggleFavorite
}) => {
  const [copiedField, setCopiedField] = useState<'email' | 'phone' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const categoryStyle = CATEGORY_STYLES[profile.category] || CATEGORY_STYLES.Personal;

  const handleCopy = (e: React.MouseEvent, text: string, field: 'email' | 'phone') => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div 
      onClick={() => onSelect(profile)}
      className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/5 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top bar: Category + Badges + Favorite & Menu */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
              {profile.category}
            </span>
            {profile.emergencyContact && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-3 h-3" />
                Emergency
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 -mr-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onToggleFavorite(profile.id, profile.favorite)}
              title={profile.favorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-1.5 rounded-lg transition-colors ${
                profile.favorite 
                  ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10' 
                  : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Star className={`w-4 h-4 ${profile.favorite ? 'fill-amber-400' : ''}`} />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-32 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-1 z-40 text-xs">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(profile);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (confirm(`Are you sure you want to delete ${profile.fullName}?`)) {
                          onDelete(profile.id);
                        }
                      }}
                      className="w-full text-left px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Avatar & Identity */}
        <div className="flex items-center gap-3.5 mb-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base text-white shadow-md flex-none transition-transform group-hover:scale-105"
            style={{ backgroundColor: profile.avatarColor || '#3B82F6' }}
          >
            {getInitials(profile.fullName)}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-white truncate group-hover:text-cyan-400 transition-colors">
              {profile.fullName}
            </h3>
            {profile.relationship && (
              <p className="text-xs text-slate-400 truncate">
                {profile.relationship}
              </p>
            )}
          </div>
        </div>

        {/* Headline */}
        {profile.headline && (
          <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
            {profile.headline}
          </p>
        )}

        {/* Info row: Company & Location */}
        <div className="space-y-1.5 mb-4 text-xs text-slate-400">
          {(profile.company || profile.role) && (
            <div className="flex items-center gap-2 truncate">
              <Building2 className="w-3.5 h-3.5 text-slate-500 flex-none" />
              <span className="truncate">
                {profile.role ? `${profile.role} at ` : ''}{profile.company}
              </span>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-500 flex-none" />
              <span className="truncate">{profile.location}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {profile.tags.slice(0, 3).map((tag, idx) => (
              <span 
                key={idx} 
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
              >
                #{tag}
              </span>
            ))}
            {profile.tags.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-400">
                +{profile.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Quick Actions */}
      <div 
        className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 text-slate-400">
          {profile.email && (
            <button
              onClick={(e) => handleCopy(e, profile.email, 'email')}
              title={`Copy email: ${profile.email}`}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-cyan-400 transition-colors flex items-center gap-1 text-xs"
            >
              {copiedField === 'email' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {profile.phone && (
            <button
              onClick={(e) => handleCopy(e, profile.phone, 'phone')}
              title={`Copy phone: ${profile.phone}`}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-cyan-400 transition-colors flex items-center gap-1 text-xs"
            >
              {copiedField === 'phone' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Phone className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {profile.socialLinks?.website && (
            <a
              href={profile.socialLinks.website}
              target="_blank"
              rel="noopener noreferrer"
              title="Visit website"
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-cyan-400 transition-colors text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <button
          onClick={() => onSelect(profile)}
          className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View Profile &rarr;
        </button>
      </div>

    </div>
  );
};
