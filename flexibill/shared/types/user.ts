export interface User {
  id: string;
  email: string;
  name: string;
  subscription: 'free' | 'essential' | 'premium' | 'data_partner';
  // Base prices before data sharing discounts
  subscriptionPricing: {
    basePrice: number;
    currentPrice: number; // After discounts
    discountPercentage: number;
  };
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