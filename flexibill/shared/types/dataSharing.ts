export type SharingLevel = 'none' | 'basic' | 'full';

export interface DataSharingPreferences {
  sharingLevel: SharingLevel;
  anonymizeAmount: boolean;
  anonymizeDates: boolean;
}