import express from 'express';
import { z } from 'zod';
import { Purchase } from '../../models/Purchase';
import { User } from '../../models/User';
import { provisionPurchaseAccess } from '../services/purchase';
import {
  getSentAccessEmails,
  resetSentAccessEmails,
  sendAccessEmail,
} from '../services/email';
import { config } from '../config/env';
import { logger } from '../lib/logger';

const router = express.Router();

const successSchema = z.object({
  email: z.string().trim().email(),
});

const failSchema = z.object({
  email: z.string().trim().email().optional(),
  paymentId: z.string().trim().min(1).optional(),
}).refine((value) => Boolean(value.email || value.paymentId), {
  message: 'Please provide a valid email or paymentId.',
});

const testEmailSchema = z.object({
  email: z.string().trim().email().optional(),
  username: z.string().trim().min(1).optional(),
  accessLink: z.string().trim().url().optional(),
  password: z.string().trim().min(1).optional(),
});

router.use((_req, res, next) => {
  if (config.isProduction) {
    return res.status(403).json({
      code: 'TEST_ROUTE_DISABLED',
      message: 'Test routes are disabled in production.',
    });
  }

  next();
});

router.post('/payment/success', async (req, res) => {
  const validation = successSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'A valid email is required.',
    });
  }

  const { email } = validation.data;
  const purchase = await Purchase.findOne({
    customerEmail: email,
    status: 'pending',
  }).sort({ createdAt: -1 });

  if (!purchase) {
    return res.status(404).json({
      code: 'PURCHASE_NOT_FOUND',
      message: 'No pending purchase found for this email.',
    });
  }

  const provisioned = await provisionPurchaseAccess(purchase.paymentId);
  logger.info('Test payment success route completed.', {
    email,
    paymentId: purchase.paymentId,
  });

  return res.status(200).json({
    ok: true,
    paymentId: purchase.paymentId,
    provisioned,
  });
});

router.post('/payment/fail', async (req, res) => {
  const validation = failSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Please provide a valid email or paymentId.',
    });
  }

  const { email, paymentId } = validation.data;
  const purchase = paymentId
    ? await Purchase.findOne({ paymentId })
    : await Purchase.findOne({
        customerEmail: email,
        status: 'pending',
      }).sort({ createdAt: -1 });

  if (!purchase) {
    return res.status(404).json({
      code: 'PURCHASE_NOT_FOUND',
      message: 'No matching purchase found.',
    });
  }

  purchase.status = 'failed';
  await purchase.save();

  logger.info('Test payment failure route completed.', {
    email: purchase.customerEmail,
    paymentId: purchase.paymentId,
  });

  return res.status(200).json({
    ok: true,
    paymentId: purchase.paymentId,
    status: purchase.status,
  });
});

router.post('/email', async (req, res) => {
  const validation = testEmailSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid test email payload.',
    });
  }

  const payload = validation.data;
  const email = payload.email || 'test@example.com';
  const username = payload.username || 'test_user';
  const accessLink = payload.accessLink || `${config.appUrl}/login`;
  const password = payload.password || 'TestPassword123';

  await sendAccessEmail(email, username, accessLink, password);

  return res.status(200).json({
    ok: true,
    sent: true,
    lastEmail: getSentAccessEmails().at(-1) ?? null,
  });
});

router.post('/reset', async (_req, res) => {
  const mockPurchases = await Purchase.find({
    $or: [{ paymentId: /^mock_/ }, { customerEmail: /@example\.com$/i }],
  }).select('customerEmail');

  const emailsToDelete = Array.from(
    new Set(mockPurchases.map((purchase) => purchase.customerEmail)),
  );

  const purchaseDeleteResult = await Purchase.deleteMany({
    $or: [{ paymentId: /^mock_/ }, { customerEmail: /@example\.com$/i }],
  });

  const userDeleteResult = await User.deleteMany({
    $or: [{ email: { $in: emailsToDelete } }, { email: /@example\.com$/i }],
  });

  resetSentAccessEmails();

  logger.info('Test reset route completed.', {
    deletedPurchases: purchaseDeleteResult.deletedCount,
    deletedUsers: userDeleteResult.deletedCount,
  });

  return res.status(200).json({
    ok: true,
    deletedPurchases: purchaseDeleteResult.deletedCount,
    deletedUsers: userDeleteResult.deletedCount,
    emailsCleared: true,
  });
});

export default router;
