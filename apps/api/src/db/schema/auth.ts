import { boolean, datetime, index, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';
import { createdAt, id, updatedAt, uuidRef } from './columns.js';

// Tablas de Better Auth (nombres en plural; el mapeo se configura en la fase 2).
export const users = mysqlTable('users', {
  id: id(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = mysqlTable(
  'sessions',
  {
    id: id(),
    expiresAt: datetime({ mode: 'date', fsp: 3 }).notNull(),
    token: varchar({ length: 255 }).notNull().unique(),
    ipAddress: text(),
    userAgent: text(),
    userId: uuidRef()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

export const accounts = mysqlTable(
  'accounts',
  {
    id: id(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: uuidRef()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: datetime({ mode: 'date', fsp: 3 }),
    refreshTokenExpiresAt: datetime({ mode: 'date', fsp: 3 }),
    scope: text(),
    password: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('accounts_user_idx').on(t.userId)],
);

export const verifications = mysqlTable(
  'verifications',
  {
    id: id(),
    identifier: varchar({ length: 255 }).notNull(),
    value: text().notNull(),
    expiresAt: datetime({ mode: 'date', fsp: 3 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('verifications_identifier_idx').on(t.identifier)],
);
