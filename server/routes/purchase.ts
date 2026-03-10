import express from 'express';
import { z } from 'zod';
import { Purchase } from '../../models/Purchase';
import { User } from '../../models/User';
import { createPayment } from '../services/payment';
import { generateTempPassword, hashPassword } from '../services/auth';
import { provisionPurchaseAccess } from '../services/purchase';
import { purchaseRateLimiter } from '../middleware/rateLimit';
import { logger } from '../lib/logger';
import {
  DEFAULT_VIDEO_ID,
  DEFAULT_VIDEO_PRICE_ILS,
  DEFAULT_VIDEO_TITLE,
} from '../../lib/catalog';

const router = express.Router();
const purchaseSchema = z.object({
  email: z.string().email(),
});

router.post('/create', purchaseRateLimiter, async (req, res) => {
  try {
    const validation = purchaseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Please enter a valid email address.',
      });
    }

    const { email } = validation.data;
    let user = await User.findOne({ email });

    if (user) {
      const existingPurchase = await Purchase.findOne({
        userId: user._id,
        videoId: DEFAULT_VIDEO_ID,
        status: 'completed',
      });

      if (existingPurchase) {
        return res.status(409).json({
          code: 'ALREADY_OWNED',
          message: 'You already own this tutorial. Check your email for access.',
        });
      }
    }

    if (!user) {
      const tempPass = await hashPassword(generateTempPassword());
      user = await User.create({
        email,
        username: email.split('@')[0] + Math.floor(Math.random() * 1000),
        passwordHash: tempPass,
      });
    }

    const payment = await createPayment(
      email,
      DEFAULT_VIDEO_PRICE_ILS,
      DEFAULT_VIDEO_TITLE,
      'Valued Dancer'
    );

    await Purchase.deleteMany({
      userId: user._id,
      videoId: DEFAULT_VIDEO_ID,
      status: 'pending',
    });

    await Purchase.create({
      userId: user._id,
      videoId: DEFAULT_VIDEO_ID,
      paymentId: payment.paymentId,
      status: 'pending',
    });

    if (payment.paymentId.startsWith('mock_')) {
      await provisionPurchaseAccess(payment.paymentId);
    }

    res.json({ 
      checkoutUrl: payment.checkoutUrl,
      paymentId: payment.paymentId,
      email,
    });
  } catch (error) {
    logger.error('Purchase error:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Unable to start payment. Please try again.',
    });
  }
});

router.post('/webhook', async (req, res) => {
  const { paymentId, status } = req.body;

  if (status === 'success' || status === 'completed') {
    try {
      await provisionPurchaseAccess(paymentId);
    } catch (error) {
      logger.error('Webhook provisioning error:', error);
    }
  }

  res.sendStatus(200);
});

export default router;
