import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { profileUpdateSchema, type MeResponse, type ProfileDto, type ProfilesResponse } from '@ekana/shared';
import type { Auth } from '../../auth/auth.js';
import { currentUser, requireAuth } from '../../auth/session.js';
import type { Db } from '../../db/client.js';
import { getMe, getProfile, listProfiles, updateMyProfile } from './service.js';

const idParamsSchema = z.object({ id: z.string().uuid() });

export function profileRoutes({ db, auth }: { db: Db; auth: Auth }): FastifyPluginAsync {
  return async (app) => {
    app.addHook('preHandler', requireAuth(auth));

    app.get('/me', async (request): Promise<MeResponse> => getMe(db, currentUser(request).id));

    app.patch('/me/profile', async (request): Promise<MeResponse> =>
      updateMyProfile(db, currentUser(request).id, profileUpdateSchema.parse(request.body ?? {})),
    );

    app.get('/profiles', async (request): Promise<ProfilesResponse> => ({
      profiles: await listProfiles(db, currentUser(request).id),
    }));

    app.get('/profiles/:id', async (request): Promise<ProfileDto> => {
      const { id } = idParamsSchema.parse(request.params);
      return getProfile(db, currentUser(request).id, id);
    });
  };
}
