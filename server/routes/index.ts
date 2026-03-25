import express from 'express';
import purchaseRoutes from './purchase';
import videoRoutes from './video';
import authRoutes from './auth';
import newsletterRoutes from './newsletter';
import testRoutes from './test';

const router = express.Router();

router.use('/purchase', purchaseRoutes);
router.use('/video', videoRoutes);
router.use('/auth', authRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/test', testRoutes);

export default router;
