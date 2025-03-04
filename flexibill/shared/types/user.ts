export interface User {
  id: string;
  email: string;
  name: string;
  subscription: 'free' | 'premium';
  dataSharing: {
    sharingLevel: 'none' | 'basic' | 'full';
    anonymizeAmount: boolean;
    anonymizeDates: boolean;
    customCategories: boolean;
  };
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    currency: string;
    language: string;
  };
  created_at: Date;
  updated_at: Date;
  last_login: Date;
}