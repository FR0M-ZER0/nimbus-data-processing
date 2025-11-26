import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Usa o novo arquivo .js
    setupFiles: ['./src/tests/setup.js'],
    
    env: {
      MONGO_URL: 'mongodb://fake-mongo:27017',
      MONGO_DB_NAME: 'nimbus_test_db',
      MONGO_COLLECTION_NAME: 'measures_test',
      SERVER_PORT: '3000',
      SERVER_ADDRESS: 'localhost',
      DATABASE_URL: 'postgresql://fake:fake@localhost:5432/nimbus'
    },

    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/src/generated/prisma/**',
      '**/src/tests/setup.js',      // Ignora o setup novo
      '**/src/tests/setup.test.js'  // Ignora o setup antigo (caso você não delete)
    ],
  },
});