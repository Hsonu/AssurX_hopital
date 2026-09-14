import { connectDB } from './index.ts';
import { AdminSessionModel } from './schema.ts';

const ADMIN_DOC_ID = 'admin';

/**
 * Check if a session ID is valid for an admin email.
 */
export async function isValidAdminSession(email: string = ADMIN_DOC_ID, sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  await connectDB();
  const doc = await AdminSessionModel.findById(email.trim().toLowerCase()).lean();
  if (!doc) return false;

  const sessions = (doc as any)?.activeSessions || [];
  const singleSession = (doc as any)?.activeSession || '';

  return sessions.includes(sessionId) || singleSession === sessionId;
}

/**
 * Add a new active session for an admin email (allowing multiple concurrent devices).
 */
export async function addAdminSession(email: string = ADMIN_DOC_ID, sessionId: string): Promise<void> {
  if (!sessionId) return;
  await connectDB();
  const normalizedEmail = email.trim().toLowerCase();

  await AdminSessionModel.findByIdAndUpdate(
    normalizedEmail,
    {
      $addToSet: { activeSessions: sessionId },
      $set: { activeSession: sessionId, updatedAt: new Date() }
    },
    { upsert: true, returnDocument: 'after' }
  );
}

/**
 * Remove a single active session (device logout) for an admin email.
 */
export async function removeAdminSession(email: string = ADMIN_DOC_ID, sessionId: string): Promise<void> {
  if (!sessionId) return;
  await connectDB();
  const normalizedEmail = email.trim().toLowerCase();

  await AdminSessionModel.findByIdAndUpdate(
    normalizedEmail,
    {
      $pull: { activeSessions: sessionId },
      $set: { updatedAt: new Date() }
    }
  );
}

/**
 * Get the current active admin session ID for backward compatibility.
 */
export async function getAdminSession(email: string = ADMIN_DOC_ID): Promise<string> {
  await connectDB();
  const doc = await AdminSessionModel.findById(email.trim().toLowerCase()).lean();
  const sessions = (doc as any)?.activeSessions || [];
  if (sessions.length > 0) return sessions[sessions.length - 1];
  return (doc as any)?.activeSession || '';
}

/**
 * Set (or add) the active admin session ID for an admin email.
 */
export async function setAdminSession(emailOrSessionId: string, sessionId?: string): Promise<void> {
  let email = ADMIN_DOC_ID;
  let sId = emailOrSessionId;

  if (sessionId !== undefined) {
    email = emailOrSessionId;
    sId = sessionId;
  }

  if (!sId) {
    await clearAdminSession(email);
  } else {
    await addAdminSession(email, sId);
  }
}

/**
 * Clear all sessions for an admin email.
 */
export async function clearAdminSession(email: string = ADMIN_DOC_ID): Promise<void> {
  await connectDB();
  const normalizedEmail = email.trim().toLowerCase();
  await AdminSessionModel.findByIdAndUpdate(
    normalizedEmail,
    { $set: { activeSessions: [], activeSession: '', updatedAt: new Date() } }
  );
}

