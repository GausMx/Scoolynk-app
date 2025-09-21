// server/models/Student.js

import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  regNo: { type: String, unique: true },
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
