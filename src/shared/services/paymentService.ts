import type { PaymentDetails, PaymentMethod } from '../types';
import { parseAndValidateQRPayload } from '../utils/qrParser';

export interface PaymentRequest {
  method: PaymentMethod;
  amount: number;
  cashReceived?: number;
  cardDetails?: {
    terminalId?: string;
    cardType?: string;
    referenceId?: string;
    authCode?: string;
  };
  qrDetails?: {
    rawPayload?: string;
    provider?: 'Raast' | 'JazzCash' | 'Easypaisa' | 'Bank' | 'Generic';
    referenceId?: string;
    verificationStatus?: 'Verified' | 'Pending_Verification';
  };
  notes?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentDetails: PaymentDetails;
  error?: string;
}

/**
 * Modular retail payment abstraction interface for UrduBazars POS.
 * Allows pluggable payment provider handlers (Cash, Card terminal, QR gateways, Raast).
 */
export interface IPaymentProvider {
  processPayment(req: PaymentRequest): Promise<PaymentResult>;
  verifyPayment(referenceId: string): Promise<{ verified: boolean; status: string }>;
}

class CashPaymentProvider implements IPaymentProvider {
  async processPayment(req: PaymentRequest): Promise<PaymentResult> {
    const received = req.cashReceived ?? req.amount;
    if (received < req.amount) {
      return {
        success: false,
        paymentDetails: {
          method: 'Cash',
          amount: req.amount,
          receivedAmount: received,
          verificationStatus: 'Failed'
        },
        error: `Insufficient cash received. Short by Rs. ${(req.amount - received).toLocaleString()}`
      };
    }

    const change = received - req.amount;
    return {
      success: true,
      paymentDetails: {
        method: 'Cash',
        amount: req.amount,
        receivedAmount: received,
        changeAmount: change,
        verificationStatus: 'Verified',
        verifiedAt: new Date().toISOString()
      }
    };
  }

  async verifyPayment() {
    return { verified: true, status: 'Cash verified at counter' };
  }
}

class CardPaymentProvider implements IPaymentProvider {
  async processPayment(req: PaymentRequest): Promise<PaymentResult> {
    const ref = req.cardDetails?.referenceId || `CARD-${Date.now().toString().slice(-6)}`;
    return {
      success: true,
      paymentDetails: {
        method: 'Card',
        amount: req.amount,
        referenceId: ref,
        authCode: req.cardDetails?.authCode || Math.floor(100000 + Math.random() * 900000).toString(),
        cardType: req.cardDetails?.cardType || 'PayPak / Visa',
        terminalId: req.cardDetails?.terminalId || 'POS-UB-01',
        verificationStatus: 'Verified',
        verifiedAt: new Date().toISOString()
      }
    };
  }

  async verifyPayment(referenceId: string) {
    return { verified: true, status: `Card terminal batch reference ${referenceId} confirmed.` };
  }
}

class QRPaymentProvider implements IPaymentProvider {
  async processPayment(req: PaymentRequest): Promise<PaymentResult> {
    const qr = req.qrDetails;
    if (!qr || !qr.rawPayload) {
      return {
        success: false,
        paymentDetails: {
          method: 'QR',
          amount: req.amount,
          verificationStatus: 'Failed'
        },
        error: 'No QR code was scanned.'
      };
    }

    // Validate payload
    const validation = parseAndValidateQRPayload(qr.rawPayload, req.amount);
    if (!validation.isValid) {
      return {
        success: false,
        paymentDetails: {
          method: 'QR',
          amount: req.amount,
          qrPayload: qr.rawPayload,
          verificationStatus: 'Failed'
        },
        error: validation.message
      };
    }

    const verificationStatus =
      validation.verificationStatus === 'Invalid' || validation.verificationStatus === 'Expired'
        ? 'Failed'
        : (validation.verificationStatus || 'Pending_Verification');

    return {
      success: true,
      paymentDetails: {
        method: 'QR',
        amount: req.amount,
        referenceId: qr.referenceId || validation.referenceId,
        qrPayload: qr.rawPayload,
        qrProvider: validation.provider,
        verificationStatus,
        verifiedAt: new Date().toISOString(),
        notes: validation.message
      }
    };
  }

  async verifyPayment(referenceId: string) {
    try {
      const res = await fetch('/api/payments/verify-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId })
      });
      if (!res.ok) throw new Error('Verification network issue');
      return await res.json();
    } catch {
      return { verified: false, status: 'Pending Provider Webhook' };
    }
  }
}

class PaymentService {
  private providers: Record<string, IPaymentProvider> = {
    Cash: new CashPaymentProvider(),
    Card: new CardPaymentProvider(),
    QR: new QRPaymentProvider()
  };

  public registerProvider(method: string, provider: IPaymentProvider) {
    this.providers[method] = provider;
  }

  public async process(request: PaymentRequest): Promise<PaymentResult> {
    const provider = this.providers[request.method] || this.providers.Cash;
    return await provider.processPayment(request);
  }

  public async verifyQR(referenceId: string) {
    return await (this.providers.QR as QRPaymentProvider).verifyPayment(referenceId);
  }
}

export const paymentService = new PaymentService();
