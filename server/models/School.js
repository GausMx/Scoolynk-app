// server/models/School.js

import mongoose from 'mongoose';


const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  schoolCode: { type: String, required: true, unique: true }, // 16-digit code
});

// Generate a unique 16-digit schoolCode before saving
schoolSchema.pre('validate', async function(next) {
  if (!this.schoolCode) {
    let code;
    let exists = true;
    while (exists) {
      code = Array.from({length: 16}, () => Math.floor(Math.random() * 10)).join('');
      exists = await mongoose.models.School.findOne({ schoolCode: code });
    }
    this.schoolCode = code;
  }
  next();
});

const School = mongoose.model('School', schoolSchema);

export default School;
