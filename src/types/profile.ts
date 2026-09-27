export type ProfileCategory = 'Personal' | 'Work' | 'Family' | 'Emergency' | 'Mentorship' | 'Network';

export interface UserPersonalProfile {
  uid: string;
  displayName: string;
  email: string;
  headline: string;
  bio: string;
  phone: string;
  location: string;
  company: string;
  role: string;
  avatarUrl?: string;
  avatarColor: string;
  skills: string[];
  interests: string[];
  status: 'available' | 'busy' | 'away' | 'focus';
  statusMessage?: string;
  socialLinks: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  preferredContactMethod: 'email' | 'phone' | 'message';
  updatedAt?: any;
  createdAt?: any;
}

export interface ManagedProfile {
  id: string;
  userId: string;
  fullName: string;
  preferredName?: string;
  headline: string;
  category: ProfileCategory;
  relationship: string;
  email: string;
  phone: string;
  altPhone?: string;
  location: string;
  company?: string;
  role?: string;
  avatarColor: string;
  avatarUrl?: string;
  status: 'active' | 'archived';
  bio: string;
  tags: string[];
  notes?: string;
  socialLinks: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  emergencyContact: boolean;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProfileFilterOptions {
  searchQuery: string;
  category: ProfileCategory | 'All';
  onlyFavorites: boolean;
  onlyEmergency: boolean;
  tagFilter: string | null;
  sortBy: 'updatedAt' | 'name' | 'category';
  sortDirection: 'asc' | 'desc';
}
