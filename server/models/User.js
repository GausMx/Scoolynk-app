// server/models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher'], required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  
  // For parents: array of children (students)
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  
  // For teachers: array of classes they teach
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  
  // For teachers: array of course names they teach
  courses: [{ type: String }],
  
  // NEW: For teachers: array of classes they are class teacher for
  classTeacherFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  
  mustChangePassword: { type: Boolean, default: false },
  subscriptionStatus: { type: String, enum: ['trial', 'active', 'inactive'], default: 'trial' },
  trialStartDate: { type: Date, default: Date.now },
  trialEndDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Middleware to automatically set trialEndDate before saving
userSchema.pre('save', function(next) {
  if (!this.trialEndDate) {
    this.trialEndDate = new Date(this.trialStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Method to compare entered password with passwordHash
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Static method to hash a password
userSchema.statics.hashPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const User = mongoose.model('User', userSchema);

export default User;