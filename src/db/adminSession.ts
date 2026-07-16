import { connectDB } from './index.ts';
import { AdminSessionModel } from './schema.ts';

const ADMIN_DOC_ID = 'admin';

/**
 * Get the current active admin session ID.
 * Returns '' if no session has been created yet.
 */
export async function getAdminSession(): Promise<string> {
  await connectDB();
  const doc = await AdminSessionModel.findById(ADMIN_DOC_ID).lean();
  return (doc as any)?.activeSession || '';
}

/**
 * Set (or replace) the active admin session ID.
 * Calling with an empty string effectively logs the admin out.
 */
export async function setAdminSession(sessionId: string): Promise<void> {
  await connectDB();
  await AdminSessionModel.findByIdAndUpdate(
    ADMIN_DOC_ID,
    { activeSession: sessionId, updatedAt: new Date() },
    { upsert: true, returnDocument: 'after' }
  );
}

/**
 * Clear the admin session (logout).
 */
export async function clearAdminSession(): Promise<void> {
  await setAdminSession('');
}
