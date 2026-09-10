import { sql } from 'drizzle-orm';
import { boolean, char, index, mysqlTable, uniqueIndex } from 'drizzle-orm/mysql-core';
import { createdAt, id, uuidRef } from './columns.js';
import { profiles } from './profiles.js';
import { roadmaps, subunits } from './roadmaps.js';
import { teams } from './teams.js';

// team_key = COALESCE(team_id, '') hace que el UNIQUE también proteja las activaciones personales
// (team_id NULL). Es VIRTUAL porque MySQL rechaza FKs con acciones referenciales sobre la columna
// base de una columna generada STORED; con VIRTUAL la FK con CASCADE y el UNIQUE funcionan.
export const activations = mysqlTable(
  'activations',
  {
    id: id(),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    roadmapId: uuidRef()
      .notNull()
      .references(() => roadmaps.id, { onDelete: 'cascade' }),
    teamId: uuidRef().references(() => teams.id, { onDelete: 'cascade' }),
    teamKey: char({ length: 36 })
      .notNull()
      .generatedAlwaysAs(sql`coalesce(\`team_id\`, '')`, { mode: 'virtual' }),
    isActive: boolean().notNull().default(true),
    startedAt: createdAt(),
  },
  (t) => [uniqueIndex('activations_user_roadmap_team_uq').on(t.userId, t.roadmapId, t.teamKey)],
);

export const progressTracking = mysqlTable(
  'progress_tracking',
  {
    id: id(),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    subunitId: uuidRef()
      .notNull()
      .references(() => subunits.id, { onDelete: 'cascade' }),
    activationId: uuidRef()
      .notNull()
      .references(() => activations.id, { onDelete: 'cascade' }),
    completedAt: createdAt(),
  },
  (t) => [
    uniqueIndex('progress_user_subunit_activation_uq').on(t.userId, t.subunitId, t.activationId),
    index('progress_user_idx').on(t.userId),
  ],
);
