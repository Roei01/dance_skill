import express, { Request, Response } from 'express';
import next from 'next';
import mongoose from 'mongoose';
import { config } from './config/env';
import { logger } from './lib/logger';
import { createApiApp } from './app';

const dev = config.isProduction === false;
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

(async () => {
  try {
    // 1. Prepare Next.js
    await app.prepare();

    // 2. Connect to MongoDB
    if (!config.dbUri) {
      throw new Error('DATABASE_URL is not defined');
    }
    
    try {
      await mongoose.connect(config.dbUri, { serverSelectionTimeoutMS: 5000 });
      logger.info('✅ Connected to MongoDB');
    } catch (err) {
      if (!config.isProduction) {
        logger.warn('⚠️ MongoDB unavailable. Using in-memory database (DEV only)');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        logger.info('✅ Connected to In-Memory MongoDB');
        logger.info(`ℹ️ URI: ${uri}`);
      } else {
        logger.error('❌ MongoDB connection failed in production');
        throw err;
      }
    }

    // 3. Initialize Express
    const server = createApiApp();


    // Handle all other requests with Next.js
    server.all(/(.*)/, (req: Request, res: Response) => {
      return handle(req, res);
    });

    server.listen(port, () => {
      logger.info(`> Ready on http://localhost:${port}`);
    });
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
})();
