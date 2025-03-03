import { DataSharingPreferences } from './dataSharing';

export interface User {
  id: string;
  email: string;
  subscription: 'free' | 'premium';
  dataSharing: DataSharingPreferences;
  created_at: string;
}

export interface AuthResponse {
  user: User | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
  error: string | null;
}