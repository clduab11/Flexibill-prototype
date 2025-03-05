export type SharingLevel = 'none' | 'basic' | 'full';

export interface DataSharingPreferences {
  sharingLevel: SharingLevel;
  anonymizeAmount: boolean;
  anonymizeDates: boolean;
}

// Constants for discount calculations
export const DATA_SHARING_DISCOUNTS = {
  // Base discounts for sharing level
  sharingLevels: {
    none: 0,        // No discount for no sharing
    basic: 0.15,    // 15% discount for basic sharing (was 10%)
    full: 0.25      // 25% discount for full sharing (was 20%)
  },
  // Additional discounts for de-anonymization
  deAnonymization: {
    amount: 3,      // $3 discount for showing real amounts (was $2)
    dates: 3,       // $3 discount for showing real dates (was $2)
    // New option for additional data sharing features
    customCategories: 2  // $2 discount for allowing custom category analysis
  }
};

// Subscription base prices (without discounts)
export const SUBSCRIPTION_BASE_PRICES = {
  free: 0,
  essential: 12.99,    // Was $9.99 - increased by $3
  premium: 19.99,      // Was $14.99 - increased by $5
  data_partner: 24.99  // Was $19.99 - increased by $5
}