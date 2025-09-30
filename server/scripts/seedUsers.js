import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import School from '../models/School.js';

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Find or create a school
  let school = await School.findOne({ name: 'Demo School' });
  if (!school) {
    school = await School.create({
      name: 'Demo School',
      address: '123 Demo St',
      adminUserId: new mongoose.Types.ObjectId(), // placeholder, not used for parent/teacher
    });
  }

  // Parent user
  const parentEmail = 'parent@example.com';
  const parentPassword = 'parent123';
  const parentPhone = '08000000001';
  const parentExists = await User.findOne({ email: parentEmail });
  if (!parentExists) {
    const passwordHash = await bcrypt.hash(parentPassword, 10);
    await User.create({
      name: 'Parent User',
      email: parentEmail,
      phone: parentPhone,
      passwordHash,
      role: 'parent',
      schoolId: school._id,
    });
    console.log(`Parent user created: ${parentEmail} / ${parentPassword}`);
  } else {
    console.log('Parent user already exists.');
  }

  // Teacher user
  const teacherEmail = 'teacher@example.com';
  const teacherPassword = 'teacher123';
  const teacherPhone = '08000000002';
  const teacherExists = await User.findOne({ email: teacherEmail });
  if (!teacherExists) {
    const passwordHash = await bcrypt.hash(teacherPassword, 10);
    await User.create({
      name: 'Teacher User',
      email: teacherEmail,
      phone: teacherPhone,
      passwordHash,
      role: 'teacher',
      schoolId: school._id,
    });
    console.log(`Teacher user created: ${teacherEmail} / ${teacherPassword}`);
  } else {
    console.log('Teacher user already exists.');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});