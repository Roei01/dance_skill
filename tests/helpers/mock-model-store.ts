type BaseRecord = {
  _id: string;
  createdAt: Date;
  save: () => Promise<any>;
};

type PurchaseRecord = BaseRecord & {
  userId?: string;
  videoId: string | { toString: () => string };
  paymentId: string;
  orderId?: string;
  customerFullName: string;
  customerPhone: string;
  customerEmail: string;
  status: 'pending' | 'completed' | 'failed';
  credentialsSentAt?: Date;
};

type UserRecord = BaseRecord & {
  email: string;
  username: string;
  passwordHash: string;
  ipAddress?: string;
  allowedIps: string[];
  activeSessionId?: string;
  activeSessionStartedAt?: Date;
  activeSessionExpiresAt?: Date;
  activeSessionDisconnectAt?: Date;
};

type VideoRecord = BaseRecord & {
  videoId?: string;
  slug: string;
  title: string;
  description: string;
  watchDescription?: string;
  classBreakdown?: Array<{
    time: string;
    label: string;
  }>;
  price: number;
  level: string;
  videoUrl: string;
  previewUrl: string;
  imageUrl?: string;
  isActive: boolean;
};

const purchases: PurchaseRecord[] = [];
const users: UserRecord[] = [];
const videos: VideoRecord[] = [];

let nextId = 1;

const buildId = () => `mock_db_${nextId++}`;

const normalizeValue = (value: unknown) => {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (value && typeof value === 'object' && 'toString' in (value as Record<string, unknown>)) {
    return String(value);
  }

  return value;
};

const matchesQuery = (
  record: Record<string, any>,
  query: Record<string, any> = {},
): boolean => {
  return Object.entries(query).every(([key, expected]): boolean => {
    if (key === '$or' && Array.isArray(expected)) {
      return expected.some((entry) => matchesQuery(record, entry));
    }

    const actual = record[key];

    if (expected instanceof RegExp) {
      return typeof actual === 'string' && expected.test(actual);
    }

    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('$in' in expected) {
        return (expected.$in as unknown[]).map(normalizeValue).includes(normalizeValue(actual));
      }
    }

    return normalizeValue(actual) === normalizeValue(expected);
  });
};

const createSingleQuery = <T>(resolver: () => T | null) => {
  const run = () => resolver();

  return {
    sort: async () => run(),
    then: <TResult1 = T | null, TResult2 = never>(
      onfulfilled?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ) => Promise.resolve(run()).then(onfulfilled, onrejected),
    catch: <TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
    ) => Promise.resolve(run()).catch(onrejected),
    finally: (onfinally?: (() => void) | null) => Promise.resolve(run()).finally(onfinally),
  };
};

const createManyQuery = <T>(resolver: () => T[]) => {
  const run = () => resolver();

  return {
    select: async () => run(),
    sort: async () => run(),
    then: <TResult1 = T[], TResult2 = never>(
      onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ) => Promise.resolve(run()).then(onfulfilled, onrejected),
    catch: <TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
    ) => Promise.resolve(run()).catch(onrejected),
    finally: (onfinally?: (() => void) | null) => Promise.resolve(run()).finally(onfinally),
  };
};

const attachPurchaseSave = (record: Omit<PurchaseRecord, 'save'>): PurchaseRecord => {
  const purchase = record as PurchaseRecord;
  purchase.save = async () => {
    const index = purchases.findIndex((entry) => entry._id === purchase._id);
    if (index >= 0) {
      purchases[index] = purchase;
    } else {
      purchases.push(purchase);
    }
    return purchase;
  };
  return purchase;
};

const attachUserSave = (record: Omit<UserRecord, 'save'>): UserRecord => {
  const user = record as UserRecord;
  user.save = async () => {
    const index = users.findIndex((entry) => entry._id === user._id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    return user;
  };
  return user;
};

const attachVideoSave = (record: Omit<VideoRecord, 'save'>): VideoRecord => {
  const video = record as VideoRecord;
  video.save = async () => {
    const index = videos.findIndex((entry) => entry._id === video._id);
    if (index >= 0) {
      videos[index] = video;
    } else {
      videos.push(video);
    }
    return video;
  };
  return video;
};

export const resetMockModelStore = () => {
  purchases.length = 0;
  users.length = 0;
  videos.length = 0;
  nextId = 1;
};

export const mockPurchaseModel = {
  findOne: (query: Record<string, any>) =>
    createSingleQuery(() => purchases.find((purchase) => matchesQuery(purchase, query)) ?? null),
  find: (query: Record<string, any>) =>
    createManyQuery(() => purchases.filter((purchase) => matchesQuery(purchase, query))),
  create: async (data: Partial<PurchaseRecord>) => {
    const purchase = attachPurchaseSave({
      _id: buildId(),
      createdAt: data.createdAt ?? new Date(),
      userId: data.userId,
      videoId: data.videoId ?? 'video_001',
      paymentId: data.paymentId ?? buildId(),
      orderId: data.orderId,
      customerFullName: data.customerFullName ?? 'Mock Purchase',
      customerPhone: data.customerPhone ?? '0500000000',
      customerEmail: data.customerEmail ?? 'mock@example.com',
      status: data.status ?? 'pending',
      credentialsSentAt: data.credentialsSentAt,
    });
    purchases.push(purchase);
    return purchase;
  },
  deleteMany: async (query: Record<string, any>) => {
    const before = purchases.length;
    const remaining = purchases.filter((purchase) => !matchesQuery(purchase, query));
    purchases.splice(0, purchases.length, ...remaining);
    return { deletedCount: before - purchases.length };
  },
  findOneAndUpdate: async (query: Record<string, any>, update: Record<string, any>) => {
    const purchase = purchases.find((entry) => matchesQuery(entry, query)) ?? null;
    if (!purchase) {
      return null;
    }
    Object.assign(purchase, update);
    return purchase;
  },
};

export const mockUserModel = {
  findById: async (id: string) =>
    users.find((user) => normalizeValue(user._id) === normalizeValue(id)) ?? null,
  findOne: (query: Record<string, any>) =>
    createSingleQuery(() => users.find((user) => matchesQuery(user, query)) ?? null),
  find: (query: Record<string, any>) =>
    createManyQuery(() => users.filter((user) => matchesQuery(user, query))),
  create: async (data: Partial<UserRecord>) => {
    const user = attachUserSave({
      _id: buildId(),
      createdAt: data.createdAt ?? new Date(),
      email: data.email ?? 'mock@example.com',
      username: data.username ?? `mock_user_${buildId()}`,
      passwordHash: data.passwordHash ?? 'hashed-password',
      ipAddress: data.ipAddress,
      allowedIps: data.allowedIps ?? [],
      activeSessionId: data.activeSessionId,
      activeSessionStartedAt: data.activeSessionStartedAt,
      activeSessionExpiresAt: data.activeSessionExpiresAt,
      activeSessionDisconnectAt: data.activeSessionDisconnectAt,
    });
    users.push(user);
    return user;
  },
  deleteMany: async (query: Record<string, any>) => {
    const before = users.length;
    const remaining = users.filter((user) => !matchesQuery(user, query));
    users.splice(0, users.length, ...remaining);
    return { deletedCount: before - users.length };
  },
};

export const mockVideoModel = {
  findOne: (query: Record<string, any>) =>
    createSingleQuery(() => videos.find((video) => matchesQuery(video, query)) ?? null),
  find: (query: Record<string, any>) =>
    createManyQuery(() => videos.filter((video) => matchesQuery(video, query))),
  findOneAndUpdate: async (
    query: Record<string, any>,
    update: Record<string, any>,
    options?: Record<string, any>
  ) => {
    const video = videos.find((entry) => matchesQuery(entry, query)) ?? null;

    if (video) {
      if (update.$set) {
        Object.assign(video, update.$set);
      }
      if (update.$setOnInsert) {
        Object.assign(video, update.$setOnInsert);
      }
      return video;
    }

    if (!options?.upsert) {
      return null;
    }

    const nextVideo = attachVideoSave({
      _id: buildId(),
      createdAt: new Date(),
      slug: query.slug ?? `video-${buildId()}`,
      title: update.$set?.title ?? update.$setOnInsert?.title ?? 'Mock Video',
      description:
        update.$set?.description ??
        update.$setOnInsert?.description ??
        'Mock description',
      watchDescription:
        update.$set?.watchDescription ??
        update.$setOnInsert?.watchDescription ??
        'Mock watch description',
      classBreakdown:
        update.$set?.classBreakdown ??
        update.$setOnInsert?.classBreakdown ??
        [],
      price: update.$set?.price ?? update.$setOnInsert?.price ?? 45,
      level: update.$set?.level ?? update.$setOnInsert?.level ?? 'Mock level',
      videoId: update.$set?.videoId ?? update.$setOnInsert?.videoId ?? query.videoId,
      videoUrl:
        update.$set?.videoUrl ??
        update.$setOnInsert?.videoUrl ??
        'https://example.com/video',
      previewUrl:
        update.$set?.previewUrl ??
        update.$setOnInsert?.previewUrl ??
        'https://example.com/preview',
      imageUrl:
        update.$set?.imageUrl ??
        update.$setOnInsert?.imageUrl ??
        'https://example.com/image',
      isActive: update.$set?.isActive ?? update.$setOnInsert?.isActive ?? true,
    });

    videos.push(nextVideo);
    return nextVideo;
  },
};
