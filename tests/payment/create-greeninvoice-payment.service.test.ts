import axios from 'axios';
import { config } from '../../server/config/env';
import { createGreenInvoicePayment } from '../../server/services/greenInvoice';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('createGreenInvoicePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    config.paymentMode = 'test';
    config.greenInvoice.key = 'greeninvoice-key';
    config.greenInvoice.secret = 'greeninvoice-secret';
    config.greenInvoice.url = 'https://api.greeninvoice.co.il/api/v1';
    config.greenInvoice.pluginId = 'plugin-id';
    config.greenInvoice.group = 100;
  });

  it('should return mock payment in test mode', async () => {
    const result = await createGreenInvoicePayment(
      'buyer@example.com',
      45,
      'Mock payment',
    );

    expect(result.checkoutUrl).toBe(`${config.appUrl}/success?mock=true`);
    expect(result.paymentId).toMatch(/^mock_/);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should return real payment in production mode', async () => {
    config.paymentMode = 'production';

    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          token: 'real-token',
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          url: 'https://pay.example.com/checkout',
          id: 'gi_real_123',
        },
      } as never);

    const result = await createGreenInvoicePayment(
      'buyer@example.com',
      45,
      'Real payment',
      {
        appBaseUrl: 'https://www.example.com',
        fullName: 'Buyer Example',
        phone: '0500000000',
        orderId: 'video_001:buyer@example.com',
        returnTo: 'https://www.example.com/#purchase',
      },
    );

    expect(result).toEqual({
      checkoutUrl: 'https://pay.example.com/checkout',
      paymentId: 'gi_real_123',
    });
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });
});
