// server/models/Student.js

import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  class: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  regNo: { type: String, unique: true },
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
