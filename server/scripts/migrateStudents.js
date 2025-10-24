import mongoose from 'mongoose';
import Student from '../models/Student.js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' }); // or just dotenv.config() if .env is in root

console.log('MONGO_URI:', process.env.MONGO_URI); // debug line

const migrateStudents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    const result = await Student.updateMany(
      {
        $or: [
          { amountPaid: { $exists: false } },
          { parentWhatsApp: { $exists: false } }
        ]
      },
      {
        $set: {
          amountPaid: 0,
          parentWhatsApp: '',
          parentName: '',
          parentEmail: ''
        }
      }
    );

    console.log(`Migration completed: ${result.modifiedCount} students updated`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrateStudents();
