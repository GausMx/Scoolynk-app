// migration-remove-payment-fields.js
// Run this ONCE to clean up payment-related fields from your database

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import your models (to ensure proper connection)
import Student from './models/Student.js';
import Class from './models/Class.js';
import School from './models/School.js';

// ANSI color codes for pretty console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

async function runMigration() {
  console.log(`${colors.cyan}==============================================`);
  console.log(`  PAYMENT FIELDS REMOVAL MIGRATION`);
  console.log(`===============================================${colors.reset}\n`);

  try {
    // ========================================
    // STEP 1: Connect to MongoDB
    // ========================================
    console.log(`${colors.blue}[1/5] Connecting to MongoDB...${colors.reset}`);
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓ Connected to database: ${mongoose.connection.name}${colors.reset}\n`);

    // ========================================
    // STEP 2: Remove payment fields from Students
    // ========================================
    console.log(`${colors.blue}[2/5] Removing payment fields from Students collection...${colors.reset}`);
    
    // Count students with payment fields before removal
    const studentsWithPayment = await Student.countDocuments({
      $or: [
        { amountPaid: { $exists: true } },
        { paymentToken: { $exists: true } },
        { lastPaymentAt: { $exists: true } }
      ]
    });
    
    console.log(`   Found ${colors.yellow}${studentsWithPayment}${colors.reset} students with payment fields`);
    
    // Remove the fields
    const studentResult = await Student.updateMany(
      {},
      { 
        $unset: { 
          amountPaid: "",
          paymentToken: "",
          lastPaymentAt: ""
        } 
      }
    );
    
    console.log(`${colors.green}✓ Removed payment fields from ${studentResult.modifiedCount} student records${colors.reset}\n`);

    // ========================================
    // STEP 3: Remove fee field from Classes
    // ========================================
    console.log(`${colors.blue}[3/5] Removing fee field from Classes collection...${colors.reset}`);
    
    // Count classes with fee before removal
    const classesWithFee = await Class.countDocuments({
      fee: { $exists: true }
    });
    
    console.log(`   Found ${colors.yellow}${classesWithFee}${colors.reset} classes with fee field`);
    
    // Remove the field
    const classResult = await Class.updateMany(
      {},
      { $unset: { fee: "" } }
    );
    
    console.log(`${colors.green}✓ Removed fee field from ${classResult.modifiedCount} class records${colors.reset}\n`);

    // ========================================
    // STEP 4: Remove fee fields from Schools
    // ========================================
    console.log(`${colors.blue}[4/5] Removing fee fields from Schools collection...${colors.reset}`);
    
    // Count schools with fee fields before removal
    const schoolsWithFees = await School.countDocuments({
      $or: [
        { defaultFee: { $exists: true } },
        { lateFee: { $exists: true } }
      ]
    });
    
    console.log(`   Found ${colors.yellow}${schoolsWithFees}${colors.reset} schools with fee fields`);
    
    // Remove the fields
    const schoolResult = await School.updateMany(
      {},
      { 
        $unset: { 
          defaultFee: "",
          lateFee: ""
        } 
      }
    );
    
    console.log(`${colors.green}✓ Removed fee fields from ${schoolResult.modifiedCount} school records${colors.reset}\n`);

    // ========================================
    // STEP 5: Verification
    // ========================================
    console.log(`${colors.blue}[5/5] Verifying migration...${colors.reset}`);
    
    const remainingStudentPayments = await Student.countDocuments({
      $or: [
        { amountPaid: { $exists: true } },
        { paymentToken: { $exists: true } },
        { lastPaymentAt: { $exists: true } }
      ]
    });
    
    const remainingClassFees = await Class.countDocuments({
      fee: { $exists: true }
    });
    
    const remainingSchoolFees = await School.countDocuments({
      $or: [
        { defaultFee: { $exists: true } },
        { lateFee: { $exists: true } }
      ]
    });
    
    if (remainingStudentPayments === 0 && remainingClassFees === 0 && remainingSchoolFees === 0) {
      console.log(`${colors.green}✓ Verification passed! All payment fields removed successfully.${colors.reset}\n`);
    } else {
      console.log(`${colors.yellow}⚠ Warning: Some fields may still exist:${colors.reset}`);
      console.log(`   Students with payment fields: ${remainingStudentPayments}`);
      console.log(`   Classes with fee field: ${remainingClassFees}`);
      console.log(`   Schools with fee fields: ${remainingSchoolFees}\n`);
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log(`${colors.cyan}==============================================`);
    console.log(`  MIGRATION SUMMARY`);
    console.log(`===============================================${colors.reset}`);
    console.log(`${colors.green}✓ Student records updated: ${studentResult.modifiedCount}`);
    console.log(`✓ Class records updated: ${classResult.modifiedCount}`);
    console.log(`✓ School records updated: ${schoolResult.modifiedCount}`);
    console.log(`✓ Total documents modified: ${studentResult.modifiedCount + classResult.modifiedCount + schoolResult.modifiedCount}${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ Migration failed:${colors.reset}`, error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // ========================================
    // Disconnect from MongoDB
    // ========================================
    await mongoose.disconnect();
    console.log(`${colors.blue}Disconnected from database${colors.reset}`);
    console.log(`${colors.green}Migration completed successfully! 🎉${colors.reset}\n`);
  }
}

// Run the migration
runMigration();