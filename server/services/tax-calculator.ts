/**
 * MISSING FEATURE FIX: Tax Calculation Service
 * Calculates sales tax based on location, product taxability, and tax rates
 */

import { logger } from '../logger';

export interface TaxCalculationInput {
  subtotal: number;
  shipping?: number;
  discount?: number;
  items: Array<{
    price: number;
    quantity: number;
    taxable?: boolean;
    taxCode?: string;
  }>;
  shippingAddress: {
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
  };
}

export interface TaxCalculationResult {
  taxTotal: number;
  taxRate: number;
  taxBreakdown: Array<{
    jurisdiction: string; // federal, state, county, city
    rate: number;
    amount: number;
  }>;
  taxableAmount: number;
}

// US State Tax Rates (2025) - Simplified for common states
// In production, integrate with TaxJar, Avalara, or similar service
const US_STATE_TAX_RATES: Record<string, number> = {
  'AL': 0.04, // Alabama
  'AK': 0.00, // Alaska (no state sales tax)
  'AZ': 0.056, // Arizona
  'AR': 0.065, // Arkansas
  'CA': 0.0725, // California (base rate, varies by locality)
  'CO': 0.029, // Colorado
  'CT': 0.0635, // Connecticut
  'DE': 0.00, // Delaware (no sales tax)
  'FL': 0.06, // Florida
  'GA': 0.04, // Georgia
  'HI': 0.04, // Hawaii
  'ID': 0.06, // Idaho
  'IL': 0.0625, // Illinois
  'IN': 0.07, // Indiana
  'IA': 0.06, // Iowa
  'KS': 0.065, // Kansas
  'KY': 0.06, // Kentucky
  'LA': 0.0445, // Louisiana
  'ME': 0.055, // Maine
  'MD': 0.06, // Maryland
  'MA': 0.0625, // Massachusetts
  'MI': 0.06, // Michigan
  'MN': 0.06875, // Minnesota
  'MS': 0.07, // Mississippi
  'MO': 0.04225, // Missouri
  'MT': 0.00, // Montana (no sales tax)
  'NE': 0.055, // Nebraska
  'NV': 0.0685, // Nevada
  'NH': 0.00, // New Hampshire (no sales tax)
  'NJ': 0.06625, // New Jersey
  'NM': 0.05125, // New Mexico
  'NY': 0.04, // New York (state rate, varies by locality)
  'NC': 0.0475, // North Carolina
  'ND': 0.05, // North Dakota
  'OH': 0.0575, // Ohio
  'OK': 0.045, // Oklahoma
  'OR': 0.00, // Oregon (no sales tax)
  'PA': 0.06, // Pennsylvania
  'RI': 0.07, // Rhode Island
  'SC': 0.06, // South Carolina
  'SD': 0.045, // South Dakota
  'TN': 0.07, // Tennessee
  'TX': 0.0625, // Texas
  'UT': 0.0485, // Utah
  'VT': 0.06, // Vermont
  'VA': 0.053, // Virginia
  'WA': 0.065, // Washington
  'WV': 0.06, // West Virginia
  'WI': 0.05, // Wisconsin
  'WY': 0.04, // Wyoming
  'DC': 0.06, // District of Columbia
};

// Local tax rates for major cities (additional to state tax)
const US_LOCAL_TAX_RATES: Record<string, Record<string, number>> = {
  'CA': {
    'Los Angeles': 0.0175,
    'San Francisco': 0.015,
    'San Diego': 0.0075,
  },
  'NY': {
    'New York': 0.04875, // NYC has significant local tax
  },
  'TX': {
    'Houston': 0.02,
    'Dallas': 0.02,
    'Austin': 0.02,
  },
  'IL': {
    'Chicago': 0.0525, // Chicago has very high local tax
  },
};

// International VAT rates (simplified)
const INTERNATIONAL_VAT_RATES: Record<string, number> = {
  'GB': 0.20, // UK
  'DE': 0.19, // Germany
  'FR': 0.20, // France
  'IT': 0.22, // Italy
  'ES': 0.21, // Spain
  'CA': 0.05, // Canada GST (provinces have additional PST/HST)
  'AU': 0.10, // Australia GST
  'JP': 0.10, // Japan Consumption Tax
  'IN': 0.18, // India GST (varies by product)
};

/**
 * Calculate tax for an order
 */
export async function calculateTax(input: TaxCalculationInput): Promise<TaxCalculationResult> {
  try {
    const { items, shippingAddress, shipping = 0, discount = 0 } = input;
    
    // Calculate taxable amount
    let taxableAmount = 0;
    for (const item of items) {
      const itemTaxable = item.taxable !== false; // Default to taxable
      if (itemTaxable) {
        taxableAmount += item.price * item.quantity;
      }
    }
    
    // Shipping is typically taxable in most states
    if (shippingAddress.country === 'US' && shipping > 0) {
      const state = shippingAddress.state?.toUpperCase();
      const shippingTaxableStates = ['CA', 'TX', 'NY', 'IL', 'FL', 'PA', 'OH', 'MI', 'NJ'];
      if (state && shippingTaxableStates.includes(state)) {
        taxableAmount += shipping;
      }
    }
    
    // Apply discounts proportionally
    if (discount > 0 && taxableAmount > 0) {
      const discountRatio = discount / (input.subtotal + shipping);
      taxableAmount = taxableAmount * (1 - discountRatio);
    }
    
    const taxBreakdown: TaxCalculationResult['taxBreakdown'] = [];
    let totalTaxRate = 0;
    
    // Calculate tax based on location
    if (shippingAddress.country === 'US') {
      const state = shippingAddress.state?.toUpperCase();
      const city = shippingAddress.city;
      
      if (state && US_STATE_TAX_RATES[state] !== undefined) {
        // State tax
        const stateRate = US_STATE_TAX_RATES[state];
        totalTaxRate += stateRate;
        
        if (stateRate > 0) {
          taxBreakdown.push({
            jurisdiction: `${state} State`,
            rate: stateRate,
            amount: taxableAmount * stateRate,
          });
        }
        
        // Local tax
        if (city && US_LOCAL_TAX_RATES[state]?.[city]) {
          const localRate = US_LOCAL_TAX_RATES[state][city];
          totalTaxRate += localRate;
          
          taxBreakdown.push({
            jurisdiction: `${city} Local`,
            rate: localRate,
            amount: taxableAmount * localRate,
          });
        }
      }
    } else if (INTERNATIONAL_VAT_RATES[shippingAddress.country]) {
      // International VAT
      const vatRate = INTERNATIONAL_VAT_RATES[shippingAddress.country];
      totalTaxRate = vatRate;
      
      taxBreakdown.push({
        jurisdiction: `${shippingAddress.country} VAT`,
        rate: vatRate,
        amount: taxableAmount * vatRate,
      });
    }
    
    const taxTotal = Math.round(taxableAmount * totalTaxRate * 100) / 100; // Round to 2 decimals
    
    logger.info('Tax calculated', {
      country: shippingAddress.country,
      state: shippingAddress.state,
      city: shippingAddress.city,
      taxableAmount,
      taxRate: totalTaxRate,
      taxTotal,
      breakdown: taxBreakdown,
    });
    
    return {
      taxTotal,
      taxRate: totalTaxRate,
      taxBreakdown,
      taxableAmount,
    };
  } catch (error) {
    logger.error('Tax calculation failed', error instanceof Error ? error : undefined);
    
    // Fallback: no tax if calculation fails
    return {
      taxTotal: 0,
      taxRate: 0,
      taxBreakdown: [],
      taxableAmount: input.subtotal,
    };
  }
}

/**
 * Validate tax calculation inputs
 */
export function validateTaxInput(input: TaxCalculationInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!input.shippingAddress) {
    errors.push('Shipping address is required for tax calculation');
  }
  
  if (!input.shippingAddress?.country) {
    errors.push('Country is required for tax calculation');
  }
  
  if (input.shippingAddress?.country === 'US' && !input.shippingAddress?.state) {
    errors.push('State is required for US tax calculation');
  }
  
  if (!input.items || input.items.length === 0) {
    errors.push('Items are required for tax calculation');
  }
  
  if (input.subtotal < 0) {
    errors.push('Subtotal cannot be negative');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get tax rate for a location (without calculation)
 */
export function getTaxRate(country: string, state?: string, city?: string): number {
  if (country === 'US' && state) {
    const stateUpper = state.toUpperCase();
    let rate = US_STATE_TAX_RATES[stateUpper] || 0;
    
    if (city && US_LOCAL_TAX_RATES[stateUpper]?.[city]) {
      rate += US_LOCAL_TAX_RATES[stateUpper][city];
    }
    
    return rate;
  }
  
  return INTERNATIONAL_VAT_RATES[country] || 0;
}
