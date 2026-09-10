import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import type { RowDataPacket } from 'mysql2/promise';
import {
  analyticsEvents,
  badgeEvents,
  messages,
  notifications,
  pointEvents,
  profiles,
  requests,
  roadmaps,
  users,
} from '../../src/db/schema/index.js';
import { closeTestDb, ER_DATA_TRUNCATED, ER_DUP_ENTRY, expectDbError, resetDb, testDb, testPool } from '../helpers/db.js';
import { createRoadmap, createTeam, createUser } from '../helpers/factories.js';

beforeEach(resetDb);
afterAll(closeTestDb);

describe('gamificación', () => {
  it('no se puede otorgar dos veces el mismo premio de puntos', async () => {
    const user = await createUser();
    await testDb.insert(pointEvents).values({ userId: user.id, points: 10, uniqueTriggerId: 'subunit:1' });
    await expectDbError(
      testDb.insert(pointEvents).values({ userId: user.id, points: 10, uniqueTriggerId: 'subunit:1' }),
      ER_DUP_ENTRY,
    );
  });

  it('los eventos sin unique_trigger_id no se deduplican', async () => {
    const user = await createUser();
    await testDb.insert(pointEvents).values([
      { userId: user.id, points: 5 },
      { userId: user.id, points: 5 },
    ]);
    expect(await testDb.select().from(pointEvents)).toHaveLength(2);
  });

  it('no se puede otorgar dos veces la misma insignia', async () => {
    const user = await createUser();
    await testDb.insert(badgeEvents).values({ userId: user.id, uniqueTriggerId: 'goal:1' });
    await expectDbError(testDb.insert(badgeEvents).values({ userId: user.id, uniqueTriggerId: 'goal:1' }), ER_DUP_ENTRY);
  });
});

describe('messages', () => {
  it('borrar al receptor borra sus mensajes directos', async () => {
    const sender = await createUser();
    const receiver = await createUser();
    await testDb.insert(messages).values({ userId: sender.id, receiverId: receiver.id, text: 'hola' });
    await testDb.delete(profiles).where(eq(profiles.id, receiver.id));
    expect(await testDb.select().from(messages)).toHaveLength(0);
  });

  it('borrar un mensaje raíz borra sus respuestas y deja en NULL la mejor respuesta', async () => {
    const user = await createUser();
    const team = await createTeam();
    const rootId = crypto.randomUUID();
    const replyId = crypto.randomUUID();
    const otherRootId = crypto.randomUUID();
    await testDb.insert(messages).values([
      { id: rootId, teamId: team.id, userId: user.id, text: 'pregunta' },
      { id: replyId, teamId: team.id, userId: user.id, text: 'respuesta', threadId: rootId },
      { id: otherRootId, teamId: team.id, userId: user.id, text: 'otra pregunta', bestResponseId: replyId },
    ]);

    await testDb.delete(messages).where(eq(messages.id, rootId));

    const remaining = await testDb.select().from(messages);
    expect(remaining.map((m) => m.id)).toEqual([otherRootId]);
    expect(remaining[0]?.bestResponseId).toBeNull();
  });
});

describe('notifications y requests', () => {
  it('una notificación nueva es info y no leída; un tipo inválido se rechaza', async () => {
    const user = await createUser();
    await testDb.insert(notifications).values({ userId: user.id, type: 'NEW_MESSAGE', title: 'Hola' });
    const [notification] = await testDb.select().from(notifications);
    expect(notification?.level).toBe('info');
    expect(notification?.read).toBe(false);

    await expectDbError(
      testPool.query('INSERT INTO notifications (id, user_id, type, metadata, created_at) VALUES (UUID(), ?, ?, ?, NOW(3))', [
        user.id,
        'NOPE',
        '{}',
      ]),
      ER_DATA_TRUNCATED,
    );
  });

  it('borrar el roadmap de una solicitud deja roadmap_id en NULL', async () => {
    const sender = await createUser();
    const roadmap = await createRoadmap(sender.id);
    await testDb.insert(requests).values({ type: 'CREATE_TEAM', senderId: sender.id, roadmapId: roadmap.id, newTeamName: 'X' });
    await testDb.delete(roadmaps).where(eq(roadmaps.id, roadmap.id));
    const [request] = await testDb.select().from(requests);
    expect(request?.roadmapId).toBeNull();
    expect(request?.status).toBe('pending');
  });

  it('borrar un usuario conserva sus eventos de analytics con user_id NULL', async () => {
    const user = await createUser();
    await testDb.insert(analyticsEvents).values({ userId: user.id, eventType: 'login' });
    await testDb.delete(users).where(eq(users.id, user.id));
    const [event] = await testDb.select().from(analyticsEvents);
    expect(event?.userId).toBeNull();
  });
});

describe('esquema completo', () => {
  it('tiene las 22 tablas del diseño', async () => {
    const [rows] = await testPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS n FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' AND table_name <> '__drizzle_migrations'`,
    );
    expect(Number(rows[0]?.n)).toBe(22);
  });
});
