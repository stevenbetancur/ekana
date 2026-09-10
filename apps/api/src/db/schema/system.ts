import { index, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { users } from './auth.js';
import { createdAt, id, jsonObject, uuidRef } from './columns.js';
import { profiles } from './profiles.js';
import { teams } from './teams.js';

export const partners = mysqlTable('partners', {
  id: id(),
  name: varchar({ length: 255 }).notNull(),
});

export const systemEvents = mysqlTable('system_events', {
  id: id(),
  userId: uuidRef().references(() => profiles.id, { onDelete: 'set null' }),
  eventType: varchar({ length: 128 }).notNull(),
  payload: jsonObject(),
  createdAt: createdAt(),
});

export const analyticsEvents = mysqlTable(
  'analytics_events',
  {
    id: id(),
    userId: uuidRef().references(() => users.id, { onDelete: 'set null' }),
    teamId: uuidRef().references(() => teams.id, { onDelete: 'set null' }),
    eventType: varchar({ length: 128 }).notNull(),
    entityType: varchar({ length: 64 }),
    entityId: uuidRef(),
    metadata: jsonObject(),
    createdAt: createdAt(),
  },
  (t) => [
    index('analytics_events_type_created_idx').on(t.eventType, t.createdAt),
    index('analytics_events_entity_idx').on(t.entityId),
  ],
);
