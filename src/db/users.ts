import { connectDB } from './index.ts';
import { UserModel, getNextId } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string) {
  await connectDB();
  try {
    // Try to find existing user
    let user = await UserModel.findOne({ uid });

    if (user) {
      // Update email if changed
      if (user.email !== email) {
        user.email = email;
        await user.save();
      }
      return { id: user.id, uid: user.uid, email: user.email, createdAt: user.createdAt };
    }

    // Create new user with auto-incremented numeric id
    const id = await getNextId('user');
    user = new UserModel({ uid, email, id });
    await user.save();
    return { id: user.id, uid: user.uid, email: user.email, createdAt: user.createdAt };
  } catch (error) {
    console.error('Failed to get or create user in DB:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

/**
 * Update the active session ID for a user.
 * Pass an empty string to invalidate (logout).
 */
export async function updateUserSession(uid: string, sessionId: string): Promise<void> {
  await connectDB();
  await UserModel.updateOne({ uid }, { $set: { activeSession: sessionId } });
}

/**
 * Retrieve the current active session ID for a user.
 * Returns '' if the user doesn't exist or has no session.
 */
export async function getUserActiveSession(uid: string): Promise<string> {
  await connectDB();
  const user = await UserModel.findOne({ uid }, { activeSession: 1 }).lean();
  return (user as any)?.activeSession || '';
}
