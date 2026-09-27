import { ManagedProfile, ProfileCategory } from '../types/profile';

export const AVATAR_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
];

export const CATEGORIES: ProfileCategory[] = [
  'Personal',
  'Work',
  'Family',
  'Emergency',
  'Mentorship',
  'Network'
];

export const CATEGORY_STYLES: Record<ProfileCategory, { bg: string; text: string; border: string }> = {
  Personal: {
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-500/30'
  },
  Work: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/30'
  },
  Family: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30'
  },
  Emergency: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/30'
  },
  Mentorship: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/30'
  },
  Network: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30'
  }
};

export const SAMPLE_PROFILES: Omit<ManagedProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    fullName: 'Dr. Elena Rostova',
    preferredName: 'Elena',
    headline: 'Chief Medical Advisor & Cardiologist',
    category: 'Emergency',
    relationship: 'Family Physician',
    email: 'elena.rostova@metrohealth.org',
    phone: '+1 (555) 234-8901',
    altPhone: '+1 (555) 234-8909',
    location: 'San Francisco, CA',
    company: 'Bayview Medical Center',
    role: 'Lead Physician',
    avatarColor: '#EC4899',
    status: 'active',
    bio: 'Primary care contact and emergency specialist with 14+ years clinical practice.',
    tags: ['Doctor', 'Cardiology', 'Emergency Contact', 'Medical Advice'],
    notes: 'Office hours: Tue/Thu 9am-4pm. Reach assistant for prescription refills.',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/elena-rostova-md',
      website: 'https://metrohealth.org/staff/rostova'
    },
    emergencyContact: true,
    favorite: true
  },
  {
    fullName: 'Marcus Vance',
    preferredName: 'Marcus',
    headline: 'VP of Engineering & Systems Architect',
    category: 'Work',
    relationship: 'Engineering Director / Former Manager',
    email: 'marcus.vance@techcore.io',
    phone: '+1 (555) 872-4319',
    location: 'Austin, TX',
    company: 'Apex Cloud Systems',
    role: 'VP of Engineering',
    avatarColor: '#3B82F6',
    status: 'active',
    bio: 'Distributed infrastructure leader, mentor on system design and technical roadmap scaling.',
    tags: ['Architecture', 'Cloud', 'Engineering', 'Leadership', 'Mentor'],
    notes: 'Collaborates on open-source projects. Preferred contact via email.',
    socialLinks: {
      github: 'https://github.com/marcusvance',
      linkedin: 'https://linkedin.com/in/marcusvance',
      twitter: 'https://twitter.com/marcusv_arch'
    },
    emergencyContact: false,
    favorite: true
  },
  {
    fullName: 'Amara Chen',
    preferredName: 'Amara',
    headline: 'Principal Product Designer & UX Researcher',
    category: 'Network',
    relationship: 'Design Peer & Co-Author',
    email: 'amara.chen@designfoundry.design',
    phone: '+1 (555) 639-0145',
    location: 'Seattle, WA',
    company: 'Design Foundry Studios',
    role: 'Principal Designer',
    avatarColor: '#8B5CF6',
    status: 'active',
    bio: 'Human-computer interaction researcher specializing in design systems, micro-interactions, and accessibility.',
    tags: ['Design Systems', 'UX Research', 'Figma', 'Accessibility'],
    notes: 'Speaker at UX World 2026. Good collaborator for early product critiques.',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/amarachen',
      website: 'https://amarachen.design',
      twitter: 'https://twitter.com/amaradesign'
    },
    emergencyContact: false,
    favorite: false
  },
  {
    fullName: 'David Sterling',
    preferredName: 'Uncle Dave',
    headline: 'Estate Attorney & Family Trustee',
    category: 'Family',
    relationship: 'Uncle & Legal Advisor',
    email: 'david.sterling@sterlinglaw.com',
    phone: '+1 (555) 441-7890',
    location: 'Chicago, IL',
    company: 'Sterling & Associates Legal',
    role: 'Senior Partner',
    avatarColor: '#10B981',
    status: 'active',
    bio: 'Family legal liaison and trust administrator. Handles document notarization and property affairs.',
    tags: ['Family', 'Legal', 'Trustee', 'Advisor'],
    notes: 'Always available for legal queries or estate documentation checks.',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/david-sterling-esq'
    },
    emergencyContact: true,
    favorite: true
  },
  {
    fullName: 'Soraya Patel',
    preferredName: 'Soraya',
    headline: 'Startup Advisor & Angel Investor',
    category: 'Mentorship',
    relationship: 'Career Mentor',
    email: 'soraya@patelventures.vc',
    phone: '+1 (555) 912-7800',
    location: 'New York, NY',
    company: 'Horizon Seed Capital',
    role: 'Managing Partner',
    avatarColor: '#F59E0B',
    status: 'active',
    bio: 'Ex-founder turned venture builder. Holds monthly 1-on-1 mentorship catchups on product strategy and hiring.',
    tags: ['Angel Investor', 'Strategy', 'Venture', 'Mentor'],
    notes: 'Quarterly coffee sync scheduled in Manhattan or via video call.',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sorayapatel',
      twitter: 'https://twitter.com/soraya_vc'
    },
    emergencyContact: false,
    favorite: false
  }
];

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function exportProfilesToJSON(profiles: ManagedProfile[]): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profiles, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `personal_profiles_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportProfilesToCSV(profiles: ManagedProfile[]): void {
  const headers = ['Full Name', 'Category', 'Relationship', 'Email', 'Phone', 'Company', 'Role', 'Location', 'Emergency Contact', 'Favorite', 'Tags', 'Bio'];
  const rows = profiles.map(p => [
    `"${p.fullName.replace(/"/g, '""')}"`,
    `"${p.category}"`,
    `"${p.relationship.replace(/"/g, '""')}"`,
    `"${p.email}"`,
    `"${p.phone}"`,
    `"${(p.company || '').replace(/"/g, '""')}"`,
    `"${(p.role || '').replace(/"/g, '""')}"`,
    `"${p.location.replace(/"/g, '""')}"`,
    p.emergencyContact ? 'Yes' : 'No',
    p.favorite ? 'Yes' : 'No',
    `"${p.tags.join('; ')}"`,
    `"${(p.bio || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", encodeURI(csvContent));
  downloadAnchor.setAttribute("download", `personal_profiles_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
