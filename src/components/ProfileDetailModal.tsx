import React from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  ExternalLink, 
  AlertTriangle, 
  Star, 
  Edit3, 
  Trash2, 
  Calendar,
  Globe,
  Github,
  Linkedin,
  Twitter,
  FileText
} from 'lucide-react';
import { ManagedProfile } from '../types/profile';
import { CATEGORY_STYLES, getInitials } from '../utils/profileHelpers';

interface ProfileDetailModalProps {
  profile: ManagedProfile | null;
  onClose: () => void;
  onEdit: (profile: ManagedProfile) => void;
  onDelete: (profileId: string) => void;
  onToggleFavorite: (profileId: string, currentVal: boolean) => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  profile,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite
}) => {
  if (!profile) return null;

  const categoryStyle = CATEGORY_STYLES[profile.category] || CATEGORY_STYLES.Personal;

  const modalMarkup = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Cover Bar */}
        <div 
          className="h-28 sm:h-32 w-full relative opacity-90"
          style={{ 
            background: `linear-gradient(135deg, ${profile.avatarColor || '#3B82F6'}44 0%, #0F172A 100%)` 
          }}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(profile.id, profile.favorite)}
              className={`p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 transition-colors ${
                profile.favorite ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
              title={profile.favorite ? 'Favorited' : 'Favorite'}
            >
              <Star className={`w-4 h-4 ${profile.favorite ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar and Top Info */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-6">
            <div className="flex items-end gap-4">
              <div 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center font-extrabold text-2xl sm:text-3xl text-white shadow-xl ring-4 ring-slate-900"
                style={{ backgroundColor: profile.avatarColor || '#3B82F6' }}
              >
                {getInitials(profile.fullName)}
              </div>
              <div className="mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {profile.fullName}
                  </h2>
                  {profile.preferredName && (
                    <span className="text-sm text-slate-400">
                      ("{profile.preferredName}")
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-cyan-400 font-medium">
                  {profile.relationship}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                {profile.category}
              </span>
              {profile.emergencyContact && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Emergency Contact
                </span>
              )}
            </div>
          </div>

          {/* Headline */}
          {profile.headline && (
            <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-4 mb-6">
              <p className="text-sm font-medium text-slate-200 leading-relaxed">
                {profile.headline}
              </p>
            </div>
          )}

          {/* Direct Communication Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/70 text-xs font-semibold text-white hover:text-cyan-400 transition-colors"
              >
                <Mail className="w-4 h-4 text-cyan-400" />
                <span className="truncate">Send Email</span>
              </a>
            )}

            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/70 text-xs font-semibold text-white hover:text-emerald-400 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span className="truncate">Call Now</span>
              </a>
            )}

            {profile.socialLinks?.website && (
              <a
                href={profile.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/70 text-xs font-semibold text-white hover:text-blue-400 transition-colors"
              >
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="truncate">Website</span>
              </a>
            )}
          </div>

          {/* Two column grid details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            
            {/* Contact Details Card */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Contact &amp; Location
              </h4>

              {profile.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 flex-none" />
                  <span className="text-white select-all">{profile.email}</span>
                </div>
              )}

              {profile.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 flex-none" />
                  <span className="text-white select-all">{profile.phone}</span>
                </div>
              )}

              {profile.altPhone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-500 flex-none" />
                  <span className="text-slate-300 select-all">Alt: {profile.altPhone}</span>
                </div>
              )}

              {profile.location && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-none" />
                  <span className="text-slate-300">{profile.location}</span>
                </div>
              )}
            </div>

            {/* Professional & Organization Card */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Professional
              </h4>

              {profile.company && (
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-slate-400 flex-none" />
                  <span className="text-white">{profile.company}</span>
                </div>
              )}

              {profile.role && (
                <div className="flex items-center gap-2.5">
                  <span className="w-4 text-center text-slate-500 font-mono text-xs">#</span>
                  <span className="text-slate-300">{profile.role}</span>
                </div>
              )}

              {/* Social links */}
              <div className="pt-1 flex items-center gap-3">
                {profile.socialLinks?.linkedin && (
                  <a 
                    href={profile.socialLinks.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {profile.socialLinks?.github && (
                  <a 
                    href={profile.socialLinks.github} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {profile.socialLinks?.twitter && (
                  <a 
                    href={profile.socialLinks.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-slate-400 hover:text-sky-400 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* Bio / Summary */}
          {profile.bio && (
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Bio &amp; Summary
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Tags */}
          {profile.tags && profile.tags.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Tags &amp; Keywords
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.tags.map((tag, i) => (
                  <span 
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Personal Notes (Private) */}
          {profile.notes && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400/90 mb-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Personal Notes (Confidential)</span>
              </div>
              <div className="text-xs text-slate-300 bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl leading-relaxed whitespace-pre-line">
                {profile.notes}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              Updated {new Date(profile.updatedAt).toLocaleDateString()}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(profile);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors border border-slate-700"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                Edit Profile
              </button>

              <button
                onClick={() => {
                  if (confirm(`Delete ${profile.fullName} from your profile database?`)) {
                    onDelete(profile.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors border border-rose-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalMarkup, document.body) : modalMarkup;
};
