import { User } from '@shared/types/user';
import { DATA_SHARING_DISCOUNTS, SUBSCRIPTION_BASE_PRICES, SharingLevel } from '@shared/types/dataSharing';

/**
 * Service responsible for subscription pricing and discount calculations
 */
export class BillingService {
  /**
   * Calculate the discount percentage based on user's data sharing preferences
   * @param sharingLevel The user's data sharing level
   * @param anonymizeAmount Whether the user has opted to anonymize amounts
   * @param anonymizeDates Whether the user has opted to anonymize dates
   * @param customCategories Whether the user has opted to share custom categories
   * @returns The discount percentage (0-1 value)
   */
  private calculateDiscountPercentage(
    sharingLevel: SharingLevel,
    anonymizeAmount: boolean,
    anonymizeDates: boolean
  ): number {
    // Get base discount for sharing level
    const baseDiscount = DATA_SHARING_DISCOUNTS.sharingLevels[sharingLevel];
    
    // No additional percentage discounts for anonymization options
    return baseDiscount;
  }

  /**
   * Calculate fixed amount discounts for de-anonymization options
   * @param anonymizeAmount Whether the user has opted to anonymize amounts
   * @param anonymizeDates Whether the user has opted to anonymize dates
   * @param customCategories Whether the user has opted to share custom categories
   * @returns The fixed amount discount in dollars
   */
  private calculateFixedDiscounts(
    anonymizeAmount: boolean,
    anonymizeDates: boolean,
    customCategories: boolean
  ): number {
    let fixedDiscount = 0;
    
    // Add discount for showing real amounts
    if (!anonymizeAmount) {
      fixedDiscount += DATA_SHARING_DISCOUNTS.deAnonymization.amount;
    }
    
    // Add discount for showing real dates
    if (!anonymizeDates) {
      fixedDiscount += DATA_SHARING_DISCOUNTS.deAnonymization.dates;
    }
    
    // Add discount for sharing custom categories
    if (customCategories) {
      fixedDiscount += DATA_SHARING_DISCOUNTS.deAnonymization.customCategories;
    }
    
    return fixedDiscount;
  }

  /**
   * Calculate the final subscription price for a user based on their plan and data sharing preferences
   * @param subscription The user's subscription tier
   * @param sharingLevel The user's data sharing level
   * @param anonymizeAmount Whether the user has opted to anonymize amounts
   * @param anonymizeDates Whether the user has opted to anonymize dates
   * @param customCategories Whether the user has opted to share custom categories
   * @returns An object containing pricing details
   */
  public calculateSubscriptionPrice(
    subscription: 'free' | 'essential' | 'premium' | 'data_partner',
    sharingLevel: SharingLevel,
    anonymizeAmount: boolean,
    anonymizeDates: boolean,
    customCategories: boolean = false
  ): { basePrice: number; currentPrice: number; discountPercentage: number } {
    // Get base price for subscription tier
    const basePrice = SUBSCRIPTION_BASE_PRICES[subscription];
    
    // Free tier has no discounts
    if (subscription === 'free') {
      return {
        basePrice: 0,
        currentPrice: 0,
        discountPercentage: 0
      };
    }
    
    // Calculate percentage discount
    const discountPercentage = this.calculateDiscountPercentage(
      sharingLevel,
      anonymizeAmount,
      anonymizeDates
    );
    
    // Calculate fixed discount amount
    const fixedDiscount = this.calculateFixedDiscounts(
      anonymizeAmount,
      anonymizeDates,
      customCategories
    );
    
    // Calculate price after percentage discount
    let discountedPrice = basePrice * (1 - discountPercentage);
    
    // Apply fixed discount, but don't go below 0
    discountedPrice = Math.max(0, discountedPrice - fixedDiscount);
    
    // Round to 2 decimal places
    discountedPrice = Math.round(discountedPrice * 100) / 100;
    
    return {
      basePrice,
      currentPrice: discountedPrice,
      discountPercentage
    };
  }

  /**
   * Update a user's pricing information based on their subscription and data sharing preferences
   * @param user The user object to update
   * @returns The updated user object
   */
  public updateUserPricing(user: User): User {
    const pricingInfo = this.calculateSubscriptionPrice(
      user.subscription,
      user.dataSharing.sharingLevel,
      user.dataSharing.anonymizeAmount,
      user.dataSharing.anonymizeDates,
      user.dataSharing.customCategories
    );
    
    return {
      ...user,
      subscriptionPricing: pricingInfo
    };
  }
}

export default new BillingService();