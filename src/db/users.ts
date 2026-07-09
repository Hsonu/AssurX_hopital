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
