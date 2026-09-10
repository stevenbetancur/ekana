import { index, int, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';
import { createdAt, id, uuidRef } from './columns.js';
import { profiles } from './profiles.js';
import { teams } from './teams.js';

// UNIQUE(user_id, unique_trigger_id): otorgar dos veces el mismo premio es imposible.
// Los eventos sin unique_trigger_id (NULL) no se deduplican.
export const pointEvents = mysqlTable(
  'point_events',
  {
    id: id(),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    teamId: uuidRef().references(() => teams.id, { onDelete: 'set null' }),
    points: int().notNull(),
    reason: varchar({ length: 255 }),
    uniqueTriggerId: varchar({ length: 255 }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('point_events_user_trigger_uq').on(t.userId, t.uniqueTriggerId),
    index('point_events_team_created_idx').on(t.teamId, t.createdAt),
  ],
);

export const badgeEvents = mysqlTable(
  'badge_events',
  {
    id: id(),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    teamId: uuidRef().references(() => teams.id, { onDelete: 'set null' }),
    reason: varchar({ length: 255 }),
    uniqueTriggerId: varchar({ length: 255 }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('badge_events_user_trigger_uq').on(t.userId, t.uniqueTriggerId),
    index('badge_events_team_created_idx').on(t.teamId, t.createdAt),
  ],
);
