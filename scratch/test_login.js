import { connectDB } from '../src/db/index.ts';
import { AdminSessionModel, BookingModel } from '../src/db/schema.ts';

async function run() {
  await connectDB();
  const sessions = await AdminSessionModel.find({}).lean();
  console.log("Sessions in DB:", sessions);
  const bookingsCount = await BookingModel.countDocuments({});
  console.log("Bookings Count in DB:", bookingsCount);
  process.exit(0);
}

run().catch(console.error);
