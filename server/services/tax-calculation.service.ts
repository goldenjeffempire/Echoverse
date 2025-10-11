import { logger } from '../logger';

interface TaxCalculationRequest {
  amount: number;
  currency: string;
  country: string;
  state?: string;
  city?: string;
  zipCode?: string;
  productType?: string;
}

interface TaxCalculationResponse {
  taxAmount: number;
  taxRate: number;
  total: number;
  breakdown: Array<{
    type: string;
    rate: number;
    amount: number;
  }>;
}

class TaxCalculationService {
  private enabled: boolean = false;
  private provider: 'taxjar' | 'avalara' | 'stripe' | 'manual' = 'manual';

  constructor() {
    this.initialize();
  }

  private initialize() {
    const provider = process.env.TAX_PROVIDER as any;
    
    if (process.env.TAXJAR_API_KEY) {
      this.provider = 'taxjar';
      this.enabled = true;
    } else if (process.env.AVALARA_API_KEY) {
      this.provider = 'avalara';
      this.enabled = true;
    } else if (process.env.STRIPE_TAX_ENABLED === 'true') {
      this.provider = 'stripe';
      this.enabled = true;
    } else {
      this.provider = 'manual';
      this.enabled = false;
      logger.warn('Tax calculation service not configured - using manual rates');
    }

    logger.info('Tax calculation service initialized', { provider: this.provider });
  }

  async calculate(request: TaxCalculationRequest): Promise<TaxCalculationResponse> {
    try {
      switch (this.provider) {
        case 'taxjar':
          return await this.calculateWithTaxJar(request);
        case 'avalara':
          return await this.calculateWithAvalara(request);
        case 'stripe':
          return await this.calculateWithStripe(request);
        default:
          return this.calculateManual(request);
      }
    } catch (error) {
      logger.error('Tax calculation failed', error as Error, { request });
      // Fallback to manual calculation
      return this.calculateManual(request);
    }
  }

  private async calculateWithTaxJar(request: TaxCalculationRequest): Promise<TaxCalculationResponse> {
    // TODO: Integrate with TaxJar API
    // const taxjar = require('taxjar');
    // const client = new taxjar({ apiKey: process.env.TAXJAR_API_KEY });
    
    logger.info('Calculating tax with TaxJar', { request });
    return this.calculateManual(request);
  }

  private async calculateWithAvalara(request: TaxCalculationRequest): Promise<TaxCalculationResponse> {
    // TODO: Integrate with Avalara API
    logger.info('Calculating tax with Avalara', { request });
    return this.calculateManual(request);
  }

  private async calculateWithStripe(request: TaxCalculationRequest): Promise<TaxCalculationResponse> {
    // TODO: Integrate with Stripe Tax
    logger.info('Calculating tax with Stripe Tax', { request });
    return this.calculateManual(request);
  }

  private calculateManual(request: TaxCalculationRequest): TaxCalculationResponse {
    // Simple manual tax calculation with common rates
    const taxRates: Record<string, number> = {
      'US-CA': 0.0725, // California
      'US-NY': 0.04,   // New York
      'US-TX': 0.0625, // Texas
      'US-FL': 0.06,   // Florida
      'US': 0.05,      // Default US
      'CA': 0.05,      // Canada GST
      'GB': 0.20,      // UK VAT
      'EU': 0.20,      // EU VAT (simplified)
      'DEFAULT': 0.00  // No tax
    };

    const key = request.state ? `${request.country}-${request.state}` : request.country;
    const taxRate = taxRates[key] || taxRates[request.country] || taxRates['DEFAULT'];
    
    const taxAmount = Math.round(request.amount * taxRate * 100) / 100;
    const total = request.amount + taxAmount;

    return {
      taxAmount,
      taxRate,
      total,
      breakdown: [
        {
          type: 'sales_tax',
          rate: taxRate,
          amount: taxAmount
        }
      ]
    };
  }

  async validate(request: TaxCalculationRequest): Promise<boolean> {
    try {
      if (!request.amount || request.amount < 0) return false;
      if (!request.currency) return false;
      if (!request.country) return false;
      return true;
    } catch (error) {
      logger.error('Tax validation failed', error as Error);
      return false;
    }
  }
}

export const taxCalculationService = new TaxCalculationService();
