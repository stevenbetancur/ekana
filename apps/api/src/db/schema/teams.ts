import { datetime, index, int, mysqlEnum, mysqlTable, primaryKey, text, varchar } from 'drizzle-orm/mysql-core';
import { USER_ROLES } from '@ekana/shared';
import { createdAt, id, jsonArray, jsonObject, updatedAt, uuidRef } from './columns.js';
import { profiles } from './profiles.js';

export const teams = mysqlTable('teams', {
  id: id(),
  name: varchar({ length: 255 }).notNull(),
  bio: text(),
  avatarUrl: text(),
  courseName: varchar({ length: 255 }),
  currentRoadmapId: uuidRef(),
  settings: jsonObject(),
  resourceLinks: jsonArray(),
  activityStatus: varchar({ length: 32 }).notNull().default('active'),
  lastActive: datetime({ mode: 'date', fsp: 3 })
    .notNull()
    .$defaultFn(() => new Date()),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const teamMembers = mysqlTable(
  'team_members',
  {
    teamId: uuidRef()
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: mysqlEnum(USER_ROLES).notNull().default('member'),
    joinedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.teamId, t.userId] }), index('team_members_user_idx').on(t.userId)],
);

export const teamGoals = mysqlTable('team_goals', {
  id: id(),
  teamId: uuidRef()
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  type: varchar({ length: 64 }),
  amount: int(),
  weeks: int(),
  description: text(),
  startDate: datetime({ mode: 'date', fsp: 3 }),
  createdAt: createdAt(),
});
