import { connectDB } from './index.ts';
import { AdminSessionModel } from './schema.ts';

const ADMIN_DOC_ID = 'admin';

/**
 * Get the current active admin session ID for a specific admin email.
 * Returns '' if no session has been created yet.
 */
export async function getAdminSession(email: string = ADMIN_DOC_ID): Promise<string> {
  await connectDB();
  const doc = await AdminSessionModel.findById(email.trim().toLowerCase()).lean();
  return (doc as any)?.activeSession || '';
}

/**
 * Set (or replace) the active admin session ID for a specific admin email.
 * Calling with an empty string effectively logs the admin out.
 */
export async function setAdminSession(emailOrSessionId: string, sessionId?: string): Promise<void> {
  await connectDB();
  let email = ADMIN_DOC_ID;
  let sId = emailOrSessionId;
  
  if (sessionId !== undefined) {
    email = emailOrSessionId;
    sId = sessionId;
  }
  
  await AdminSessionModel.findByIdAndUpdate(
    email.trim().toLowerCase(),
    { activeSession: sId, updatedAt: new Date() },
    { upsert: true, returnDocument: 'after' }
  );
}

/**
 * Clear the admin session (logout) for a specific admin email.
 */
export async function clearAdminSession(email: string = ADMIN_DOC_ID): Promise<void> {
  await setAdminSession(email, '');
}
