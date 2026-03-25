import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { resetSentAccessEmails } from '../../server/services/email';
import { config } from '../../server/config/env';

let mongoServer: MongoMemoryServer | null = null;
const buildRandomMongoPort = () => 20000 + Math.floor(Math.random() * 20000);
const fallbackMongoUri = `mongodb://127.0.0.1:27017/rbdt-online-tests-${process.pid}`;

export const connectTestDatabase = async () => {
  let uri = fallbackMongoUri;

  if (!mongoServer) {
    try {
      mongoServer = await MongoMemoryServer.create({
        instance: {
          port: buildRandomMongoPort(),
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
