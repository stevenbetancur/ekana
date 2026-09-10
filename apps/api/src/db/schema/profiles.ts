import { boolean, date, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';
import { users } from './auth.js';
import { createdAt, jsonObject, updatedAt, uuidRef } from './columns.js';

// name, email y avatar (image) viven en `users`; aquí solo el resto del perfil.
export const profiles = mysqlTable('profiles', {
  id: uuidRef()
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  bio: text(),
  activeCourse: varchar({ length: 255 }),
  isPremium: boolean().notNull().default(false),
  profileComplete: boolean().notNull().default(false),
  hasActiveTeam: boolean().notNull().default(false),
  birthDate: date({ mode: 'string' }),
  location: varchar({ length: 255 }),
  onboardingData: jsonObject(),
  preferences: jsonObject(),
  schedule: jsonObject(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
