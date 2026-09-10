import { randomUUID } from 'node:crypto';
import { char, datetime, json } from 'drizzle-orm/mysql-core';

export const id = () =>
  char({ length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID());

export const uuidRef = () => char({ length: 36 });

export const createdAt = () =>
  datetime({ mode: 'date', fsp: 3 })
    .notNull()
    .$defaultFn(() => new Date());

export const updatedAt = () =>
  datetime({ mode: 'date', fsp: 3 })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date());

export const jsonObject = () =>
  json()
    .$type<Record<string, unknown>>()
    .notNull()
    .$defaultFn(() => ({}));

export const jsonArray = () =>
  json()
    .$type<unknown[]>()
    .notNull()
    .$defaultFn(() => []);
