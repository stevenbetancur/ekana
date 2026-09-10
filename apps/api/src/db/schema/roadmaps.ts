import { boolean, datetime, index, int, mysqlEnum, mysqlTable, text, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';
import { ROADMAP_OWNER_TYPES } from '@ekana/shared';
import { createdAt, id, jsonObject, updatedAt, uuidRef } from './columns.js';
import { profiles } from './profiles.js';

// owner_id es polimórfico (usuario o equipo según owner_type): sin FK, lo valida el servicio.
export const roadmaps = mysqlTable(
  'roadmaps',
  {
    id: id(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    ownerId: uuidRef().notNull(),
    ownerType: mysqlEnum(ROADMAP_OWNER_TYPES).notNull().default('USER'),
    isPublic: boolean().notNull().default(false),
    isPaid: boolean().notNull().default(false),
    metadata: jsonObject(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('roadmaps_owner_idx').on(t.ownerType, t.ownerId), index('roadmaps_public_idx').on(t.isPublic)],
);

export const units = mysqlTable(
  'units',
  {
    id: id(),
    roadmapId: uuidRef()
      .notNull()
      .references(() => roadmaps.id, { onDelete: 'cascade' }),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    sequenceOrder: int().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('units_roadmap_order_idx').on(t.roadmapId, t.sequenceOrder)],
);

export const subunits = mysqlTable(
  'subunits',
  {
    id: id(),
    unitId: uuidRef()
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    title: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 64 }).notNull(),
    contentUrl: text(),
    duration: varchar({ length: 64 }),
    sequenceOrder: int().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('subunits_unit_order_idx').on(t.unitId, t.sequenceOrder)],
);

export const userEntitlements = mysqlTable(
  'user_entitlements',
  {
    id: id(),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    roadmapId: uuidRef()
      .notNull()
      .references(() => roadmaps.id, { onDelete: 'cascade' }),
    accessType: varchar({ length: 64 }),
    expiresAt: datetime({ mode: 'date', fsp: 3 }),
  },
  (t) => [uniqueIndex('user_entitlements_user_roadmap_uq').on(t.userId, t.roadmapId)],
);
