// server/models/Student.js - PAYMENT FIELDS REMOVED

import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  regNo: {
    type: String,
    required: true,
    trim: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  parentPhone: {
    type: String,
    trim: true,
    default: ''
  },
  parentName: {
    type: String,
    trim: true,
    default: ''
  },
  parentEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  // ADDITIONAL INFO
  dateOfBirth: {
    type: Date
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'transferred'],
    default: 'active'
  }
}, {
  timestamps: true
});

// ========== INDEXES ==========
studentSchema.index({ regNo: 1, schoolId: 1 }, { unique: true });
studentSchema.index({ schoolId: 1, classId: 1 });
studentSchema.index({ schoolId: 1, name: 1 });
studentSchema.index({ schoolId: 1, status: 1 });
studentSchema.index({ schoolId: 1, parentPhone: 1 });

// ========== METHODS ==========
// Helper method to get student's full info
studentSchema.methods.getFullInfo = function() {
  return {
    id: this._id,
    name: this.name,
    regNo: this.regNo,
    class: this.classId?.name || 'Unknown',
    parentName: this.parentName,
    parentPhone: this.parentPhone,
    parentEmail: this.parentEmail,
    status: this.status,
    enrollmentDate: this.enrollmentDate
  };
};

// Static method to find active students in a class
studentSchema.statics.findActiveByClass = function(classId, schoolId) {
  return this.find({ 
    classId, 
    schoolId, 
    status: 'active' 
  })
  .populate('classId', 'name')
  .sort({ name: 1 });
};

// Static method to search students
studentSchema.statics.searchStudents = function(schoolId, searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    schoolId,
    $or: [
      { name: regex },
      { regNo: regex },
      { parentName: regex },
      { parentPhone: regex }
    ]
  })
  .populate('classId', 'name')
  .sort({ name: 1 });
};

const Student = mongoose.model('Student', studentSchema);

export default Student;