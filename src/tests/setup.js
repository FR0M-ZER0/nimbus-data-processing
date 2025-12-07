import { vi } from 'vitest';

// Mock Global do Prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    parametro: { findFirst: vi.fn() },
    medida: { createMany: vi.fn() },
  }
}));

// Mock Global do MongoDB
vi.mock('mongodb', () => {
  return {
    MongoClient: class {
      constructor() {}
      connect() { return Promise.resolve(this); }
      db() { return this; }
      collection() { return this; }
      find() { return { toArray: () => Promise.resolve([]) }; }
      findOne() { return Promise.resolve(null); }
      insertOne() { return Promise.resolve({ insertedId: 'mock-id' }); }
      deleteOne() { return Promise.resolve({ deletedCount: 1 }); }
      close() { return Promise.resolve(); }
    },
    ObjectId: class {
      constructor(id) { this.id = id || '000000000000000000000000'; }
      toString() { return this.id; }
    }
  };
});