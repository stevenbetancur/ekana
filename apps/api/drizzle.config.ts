import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'mysql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  casing: 'snake_case',
});
