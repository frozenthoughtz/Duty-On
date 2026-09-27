import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Globe, 
  Linkedin, 
  Github, 
  Twitter, 
  Save, 
  Check, 
  Sparkles, 
  Tag, 
  Plus, 
  X,
  AlertCircle,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AVATAR_COLORS, getInitials } from '../utils/profileHelpers';

export const MyProfileView: React.FC = () => {
  const { userProfile, updatePersonalProfile, isAnonymous, currentUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [status, setStatus] = useState<'available' | 'busy' | 'away' | 'focus'>('available');
  const [statusMessage, setStatusMessage] = useState('');
  
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');

  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState<'email' | 'phone' | 'message'>('email');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || currentUser?.displayName || '');
      setHeadline(userProfile.headline || '');
      setBio(userProfile.bio || '');
      setPhone(userProfile.phone || '');
      setLocation(userProfile.location || '');
      setCompany(userProfile.company || '');
      setRole(userProfile.role || '');
      setAvatarColor(userProfile.avatarColor || AVATAR_COLORS[0]);
      setStatus(userProfile.status || 'available');
      setStatusMessage(userProfile.statusMessage || '');
      setSkills(userProfile.skills || []);
      setInterests(userProfile.interests || []);
      setLinkedin(userProfile.socialLinks?.linkedin || '');
      setGithub(userProfile.socialLinks?.github || '');
      setTwitter(userProfile.socialLinks?.twitter || '');
      setWebsite(userProfile.socialLinks?.website || '');
      setPreferredContactMethod(userProfile.preferredContactMethod || 'email');
    }
  }, [userProfile, currentUser]);

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (idx: number) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  const handleAddInterest = () => {
    const trimmed = interestInput.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (idx: number) => {
    setInterests(interests.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      await updatePersonalProfile({
        displayName: displayName.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        location: location.trim(),
        company: company.trim(),
        role: role.trim(),
        avatarColor,
        status,
        statusMessage: statusMessage.trim(),
        skills,
        interests,
        preferredContactMethod,
        socialLinks: {
          linkedin: linkedin.trim(),
          github: github.trim(),
          twitter: twitter.trim(),
          website: website.trim()
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  const statusColors = {
    available: 'bg-emerald-400',
    busy: 'bg-rose-400',
    away: 'bg-amber-400',
    focus: 'bg-purple-400'
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* Top Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Personal Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Your personal digital dossier and identity stored securely in Firestore.
          </p>
        </div>

        {/* Live sync badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Cloud Synced
          </span>
        </div>
      </div>

      {isAnonymous && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 flex-none mt-0.5 text-amber-400" />
          <div>
            <p className="font-bold">You are currently using a Guest Session</p>
            <p className="text-amber-300/80 mt-0.5">
              Changes are saved to your real Firebase guest record in the cloud.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-none" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-6 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Your personal profile has been updated and synchronized to Firestore!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Live Profile Preview Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Live Profile Preview
            </h3>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {/* Card Banner */}
              <div 
                className="h-24 w-full relative"
                style={{ 
                  background: `linear-gradient(135deg, ${avatarColor}55 0%, #0F172A 100%)` 
                }}
              />

              <div className="px-5 pb-5 pt-0 relative">
                <div className="flex items-end justify-between -mt-10 mb-3">
                  <div className="relative">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-xl text-white shadow-lg ring-4 ring-slate-900"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {getInitials(displayName || 'User')}
                    </div>
                    <span 
                      className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ring-2 ring-slate-900 ${statusColors[status]}`}
                      title={`Status: ${status}`}
                    />
                  </div>

                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                    {status}
                  </span>
                </div>

                <h2 className="font-extrabold text-base text-white truncate">
                  {displayName || 'Anonymous User'}
                </h2>
                <p className="text-xs text-cyan-400 font-medium truncate mb-2">
                  {role ? `${role}${company ? ` at ${company}` : ''}` : (company || 'Profile Owner')}
                </p>

                {headline && (
                  <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                    {headline}
                  </p>
                )}

                {statusMessage && (
                  <div className="text-[11px] text-slate-400 bg-slate-800/60 rounded-xl px-2.5 py-1.5 mb-3 flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-cyan-400 flex-none" />
                    <span className="truncate">{statusMessage}</span>
                  </div>
                )}

                {/* Location & Contact Info */}
                <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                  {location && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{location}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate text-slate-300">{currentUser?.email || 'guest@preview.local'}</span>
                  </div>
                </div>

                {/* Skills tags */}
                {skills.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">Core Competencies</div>
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 4).map((s, idx) => (
                        <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                          #{s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social icons */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-3 text-slate-400">
                  {linkedin && <Linkedin className="w-4 h-4 hover:text-cyan-400" />}
                  {github && <Github className="w-4 h-4 hover:text-white" />}
                  {twitter && <Twitter className="w-4 h-4 hover:text-sky-400" />}
                  {website && <Globe className="w-4 h-4 hover:text-emerald-400" />}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Editor Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            
            {/* 1. Profile Core */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4">
                1. Identity &amp; Presence
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Current Availability Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="available">🟢 Available / Reachable</option>
                    <option value="busy">🔴 Busy / In Meeting</option>
                    <option value="away">🟡 Away / Traveling</option>
                    <option value="focus">🟣 Deep Focus / Do Not Disturb</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Headline / Professional Title
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Lead Systems Engineer & Health Tech Researcher"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Status Message / Notice
                </label>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="e.g. Available for consulting inquiries this week"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Profile Accent Color
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setAvatarColor(c)}
                      className="w-7 h-7 rounded-full transition-transform flex items-center justify-center shadow-sm"
                      style={{ 
                        backgroundColor: c,
                        transform: avatarColor === c ? 'scale(1.2)' : 'scale(1)',
                        outline: avatarColor === c ? '2px solid white' : 'none'
                      }}
                    >
                      {avatarColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Employment & Location */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4">
                2. Organization &amp; Location
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Apex Cloud Systems"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Role / Position
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Engineering Director"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Bio & Contact Details */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4">
                3. About &amp; Contact
              </h3>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bio / Personal Summary
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short summary about your background, career focus, and interests..."
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preferred Contact Channel
                  </label>
                  <select
                    value={preferredContactMethod}
                    onChange={(e) => setPreferredContactMethod(e.target.value as any)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone / Voice Call</option>
                    <option value="message">Direct Message / SMS</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Skills and Interests manager */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4">
                4. Skills &amp; Interests
              </h3>

              {/* Skills */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Core Skills (Press Enter to add)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="e.g. Distributed Systems, Product Strategy"
                    className="flex-1 bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700"
                  >
                    Add
                  </button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700">
                        #{s}
                        <button type="button" onClick={() => handleRemoveSkill(idx)} className="text-slate-400 hover:text-rose-400">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Interests */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Personal Interests &amp; Hobbies
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInterest();
                      }
                    }}
                    placeholder="e.g. Sailing, Classical Music, Angel Investing"
                    className="flex-1 bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700"
                  >
                    Add
                  </button>
                </div>
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((it, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700">
                        {it}
                        <button type="button" onClick={() => handleRemoveInterest(idx)} className="text-slate-400 hover:text-rose-400">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 5. Social & Portfolio */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4">
                5. Social &amp; Portfolio Links
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Linkedin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="LinkedIn Profile URL"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="relative">
                  <Github className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="GitHub Profile URL"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="relative">
                  <Twitter className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="Twitter / X profile URL"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Personal Website URL"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 text-slate-950" />
                    <span>Save to Firestore</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
};
