// server/scripts/migrateStudentFields.js
// Run this ONCE to migrate existing student data from parentWhatsApp to parentPhone

import mongoose from 'mongoose';
import dotenv from 'dotenv';
MONGODB_URI = process.env.MONGO_URI;
dotenv.config({ path: './server/.env' }); // or just dotenv.config() if .env is in root

console.log('MONGO_URI:', process.env.MONGO_URI); // debug line

const migrateStudents = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Student = mongoose.model('Student');

    // Check if parentWhatsApp field exists in any documents
    const studentsWithOldField = await Student.countDocuments({ 
      parentWhatsApp: { $exists: true } 
    });

    console.log(`📊 Found ${studentsWithOldField} students with old field 'parentWhatsApp'`);

    if (studentsWithOldField === 0) {
      console.log('✅ No migration needed. All students already use parentPhone field.');
      process.exit(0);
    }

    // Migrate data from parentWhatsApp to parentPhone
    console.log('🔄 Starting migration...');
    
    const result = await Student.updateMany(
      { 
        parentWhatsApp: { $exists: true },
        $or: [
          { parentPhone: { $exists: false } },
          { parentPhone: '' },
          { parentPhone: null }
        ]
      },
      [
        {
          $set: {
            parentPhone: {
              $cond: {
                if: { $or: [
                  { $eq: ['$parentPhone', ''] },
                  { $eq: ['$parentPhone', null] },
                  { $not: '$parentPhone' }
                ]},
                then: '$parentWhatsApp',
                else: '$parentPhone'
              }
            }
          }
        }
      ]
    );

    console.log(`✅ Migrated ${result.modifiedCount} students`);

    // Remove the old parentWhatsApp field
    console.log('🗑️  Removing old parentWhatsApp field...');
    
    const removeResult = await Student.updateMany(
      { parentWhatsApp: { $exists: true } },
      { $unset: { parentWhatsApp: '' } }
    );

    console.log(`✅ Removed parentWhatsApp from ${removeResult.modifiedCount} documents`);

    // Verify migration
    const verification = await Student.countDocuments({ 
      parentWhatsApp: { $exists: true } 
    });

    if (verification === 0) {
      console.log('✅✅✅ Migration completed successfully!');
      console.log('All students now use parentPhone field.');
    } else {
      console.warn(`⚠️  Warning: ${verification} documents still have parentWhatsApp field`);
    }

    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration
migrateStudents();