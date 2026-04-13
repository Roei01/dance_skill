import mongoose from 'mongoose';
import net from 'net';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { resetSentAccessEmails } from '../../server/services/email';
import { config } from '../../server/config/env';

let mongoServer: MongoMemoryServer | null = null;
const fallbackMongoUri = `mongodb://127.0.0.1:27017/rbdt-online-tests-${process.pid}`;

const getAvailablePort = async () =>
  new Promise<number>((resolve, reject) => {
    const server = net.createServer();

    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Unable to resolve free MongoDB port.')));
        return;
      }

      const { port } = address;
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }
        resolve(port);
      });
    });
  });

export const connectTestDatabase = async () => {
  let uri = fallbackMongoUri;

  if (!mongoServer) {
    try {
      const port = await getAvailablePort();
      mongoServer = await MongoMemoryServer.create({
        instance: {
          port,
          dbName: 'rbdt-online-tests',
        },
      });
      uri = mongoServer.getUri();
    } catch {
      mongoServer = null;
    }
  } else {
    uri = mongoServer.getUri();
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
};

export const clearTestDatabase = async () => {
  const collections = mongoose.connection.collections;

  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );

  resetSentAccessEmails();
  config.paymentMode = 'test';
};

export const disconnectTestDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};
