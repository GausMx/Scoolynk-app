// server/models/Class.js - PAYMENT FIELDS REMOVED

import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // teachers for this class
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
}); 

const Class = mongoose.model('Class', classSchema);

export default Class;