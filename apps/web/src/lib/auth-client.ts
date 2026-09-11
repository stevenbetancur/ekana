import { createAuthClient } from "better-auth/react";

// Mismo origen que el front: Vite (local) y Vercel (producción) reenvían /api/auth al API.
export const authClient = createAuthClient({ baseURL: window.location.origin });
