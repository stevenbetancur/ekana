import { boolean, index, mysqlEnum, mysqlTable, text, varchar, type AnyMySqlColumn } from 'drizzle-orm/mysql-core';
import { NOTIFICATION_LEVELS, NOTIFICATION_TYPES, REQUEST_STATUSES, REQUEST_TYPES } from '@ekana/shared';
import { createdAt, id, jsonObject, updatedAt, uuidRef } from './columns.js';
import { profiles } from './profiles.js';
import { roadmaps } from './roadmaps.js';
import { teams } from './teams.js';

export const requests = mysqlTable(
  'requests',
  {
    id: id(),
    type: mysqlEnum(REQUEST_TYPES).notNull(),
    senderId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    // NULL en REQUEST_TO_JOIN: la reciben todos los admins del equipo.
    recipientId: uuidRef().references(() => profiles.id, { onDelete: 'cascade' }),
    teamId: uuidRef().references(() => teams.id, { onDelete: 'cascade' }),
    roadmapId: uuidRef().references(() => roadmaps.id, { onDelete: 'set null' }),
    status: mysqlEnum(REQUEST_STATUSES).notNull().default('pending'),
    message: text(),
    newTeamName: varchar({ length: 255 }),
    makeAdmin: boolean().notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('requests_recipient_status_idx').on(t.recipientId, t.status),
    index('requests_sender_idx').on(t.senderId),
    index('requests_team_status_idx').on(t.teamId, t.status),
  ],
);

// Exactamente uno de team_id / receiver_id tiene valor. Se valida en el API: MySQL prohíbe
// CHECK sobre columnas con acciones referenciales de FK.
export const messages = mysqlTable(
  'messages',
  {
    id: id(),
    teamId: uuidRef().references(() => teams.id, { onDelete: 'cascade' }),
    receiverId: uuidRef().references(() => profiles.id, { onDelete: 'cascade' }),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    text: text().notNull(),
    handle: varchar({ length: 255 }),
    threadId: uuidRef().references((): AnyMySqlColumn => messages.id, { onDelete: 'cascade' }),
    bestResponseId: uuidRef().references((): AnyMySqlColumn => messages.id, { onDelete: 'set null' }),
    isDeleted: boolean().notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('messages_team_created_idx').on(t.teamId, t.createdAt),
    index('messages_dm_idx').on(t.userId, t.receiverId, t.createdAt),
    index('messages_thread_idx').on(t.threadId),
  ],
);

export const notifications = mysqlTable(
  'notifications',
  {
    id: id(),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: mysqlEnum(NOTIFICATION_TYPES).notNull(),
    level: mysqlEnum(NOTIFICATION_LEVELS).notNull().default('info'),
    read: boolean().notNull().default(false),
    title: varchar({ length: 255 }),
    message: text(),
    link: text(),
    metadata: jsonObject(),
    createdAt: createdAt(),
  },
  (t) => [index('notifications_user_read_created_idx').on(t.userId, t.read, t.createdAt)],
);
