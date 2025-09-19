// server/models/School.js

import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
});

const School = mongoose.model('School', schoolSchema);

export default School;
