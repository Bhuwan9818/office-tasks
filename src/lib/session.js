// lib/session.js
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'fallback-secret-please-set-env-var-32chars',
  cookieName: 'office_tasks_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

// Call this inside any App Router route handler (no req/res needed)
export async function getSession() {
  const cookieStore = cookies();
  return await getIronSession(cookieStore, sessionOptions);
}

// Returns session if logged in, null if not
export async function getAuthSession() {
  const session = await getSession();
  if (!session?.user) return null;
  return session;
}
