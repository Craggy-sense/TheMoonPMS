import crypto from 'crypto';

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string; // 'success' | 'failed' | 'abandoned'
    reference: string;
    amount: number; // in kobo / cents (e.g. 100 KES = 10000)
    currency: string;
    gateway_response: string;
    paid_at: string;
    channel: string; // 'mobile_money' | 'card' | etc.
    customer: {
      email: string;
      customer_code?: string;
    };
    metadata?: any;
  };
}

export function getPaystackSecretKey(): string {
  // Uses environment variable or a test sandbox key for immediate demo
  return process.env.PAYSTACK_SECRET_KEY || 'sandbox_secret_placeholder_the_moon_apartments';
}

export function getPaystackPublicKey(): string {
  return process.env.PAYSTACK_PUBLIC_KEY || 'sandbox_public_placeholder_the_moon_apartments';
}

/**
 * Initializes a Paystack transaction for M-Pesa & Card checkout
 */
export async function initializePaystackPayment(params: {
  email: string;
  amountInUnits: number; // e.g. 5000 KES
  currency?: 'KES' | 'USD';
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}): Promise<PaystackInitResponse> {
  const secretKey = getPaystackSecretKey();
  const currency = params.currency || 'KES';
  
  // Paystack expects amount in minor currency units (e.g. cents/kobo = amount * 100)
  const amountInMinor = Math.round(params.amountInUnits * 100);
  const reference = params.reference || `moon-pay-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  // If using placeholder key or offline demo, simulate seamless sandbox response
  if (!process.env.PAYSTACK_SECRET_KEY || secretKey.includes('placeholder')) {
    return {
      status: true,
      message: 'Authorization URL created (Sandbox Demo Mode)',
      data: {
        authorization_url: `/pay/mock-checkout?reference=${reference}&amount=${params.amountInUnits}&currency=${currency}&email=${encodeURIComponent(params.email)}`,
        access_code: `mock_code_${reference}`,
        reference,
      },
    };
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: amountInMinor,
      currency,
      reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata || {},
      channels: ['card', 'mobile_money', 'bank', 'ussd', 'qr'],
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Failed to initialize Paystack transaction');
  }

  return data;
}

/**
 * Verifies transaction with Paystack API
 */
export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResponse> {
  const secretKey = getPaystackSecretKey();

  // If demo mode
  if (!process.env.PAYSTACK_SECRET_KEY || secretKey.includes('placeholder')) {
    return {
      status: true,
      message: 'Verification successful (Sandbox Demo Mode)',
      data: {
        id: 10928374,
        status: 'success',
        reference,
        amount: 500000,
        currency: 'KES',
        gateway_response: 'Successful (M-Pesa STK Push)',
        paid_at: new Date().toISOString(),
        channel: 'mobile_money',
        customer: { email: 'guest@themoonapartments.com' },
      },
    };
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Verification failed');
  }

  return data;
}

/**
 * Validates Paystack webhook HMAC SHA512 signature
 */
export function verifyPaystackSignature(rawBody: string, signature: string): boolean {
  const secretKey = getPaystackSecretKey();
  const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
  return hash === signature;
}
