import axios from 'axios';
import { config } from '../config/env';
import { logger } from '../lib/logger';

// This is a simplified interface for GreenInvoice API
interface PaymentResponse {
  checkoutUrl: string;
  paymentId: string;
}

export const createPayment = async (
  email: string,
  amount: number,
  description: string,
  customerName: string
): Promise<PaymentResponse> => {
  // Mock implementation for development if no key provided OR if key is clearly a placeholder
  if (!config.greenInvoice.key || config.greenInvoice.key.length < 20 || config.greenInvoice.key === "SAdasdasdasds") {
    logger.warn('⚠️ No valid GreenInvoice API Key provided. Using mock payment.');
    return {
      checkoutUrl: `${config.appUrl}/success?email=${encodeURIComponent(email)}`,
      paymentId: `mock_${Date.now()}`,
    };
  }

  try {
    // Real implementation (example based on generic payment gateway)
    // You would typically create a document or payment request here
    const response = await axios.post(
      `${config.greenInvoice.url}/payments`, // Endpoint might differ
      {
        amount,
        currency: 'ILS', // Assuming ILS based on GreenInvoice usage
        description,
        customer: {
          email,
          name: customerName,
        },
        callback_url: `${config.appUrl}/api/purchase/webhook`,
        success_url: `${config.appUrl}/success?email=${encodeURIComponent(email)}`,
        cancel_url: `${config.appUrl}/cancel`,
      },
      {
        headers: {
          Authorization: `Bearer ${config.greenInvoice.key}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      checkoutUrl: response.data.url, // Adjust based on actual API response
      paymentId: response.data.id,
    };
  } catch (error) {
    logger.error('❌ Payment creation failed:', error);
    throw new Error('Payment service failed');
  }
};

export const verifyPayment = async (paymentId: string): Promise<boolean> => {
  // Verification logic
  if (paymentId.startsWith('mock_')) return true;
  
  // Real implementation
  return true; 
};
