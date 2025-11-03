// server/models/ResultTemplate.js

import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  label: { type: String, required: true }, // e.g., "Student Name", "CA1", "Exam"
  type: { type: String, enum: ['text', 'number', 'date', 'signature', 'image', 'table'], required: true },
  coordinates: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  isEditable: { type: Boolean, default: true },
  isRequired: { type: Boolean, default: false },
  category: { 
    type: String, 
    enum: ['student_info', 'scores', 'affective', 'comments', 'fees', 'attendance', 'other'],
    default: 'other'
  }
}, { _id: false });

const subjectColumnSchema = new mongoose.Schema({
  name: { type: String, required: true }, // CA1, CA2, Exam, Total, Grade, Remark
  coordinates: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  }
}, { _id: false });

const resultTemplateSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Default Result Template'
  },
  term: {
    type: String,
    enum: ['First Term', 'Second Term', 'Third Term'],
    required: true
  },
  session: {
    type: String,
    required: true // e.g., "2024/2025"
  },
  // Scanned template image stored as base64
  templateImage: {
    type: String, // Base64 encoded image
    required: true
  },
  
  // Extracted template structure
  layout: {
    // Header section (school name, logo, motto)
    header: {
      schoolName: fieldSchema,
      logo: fieldSchema,
      address: fieldSchema,
      motto: fieldSchema
    },
    
    // Student information section
    studentInfo: {
      name: fieldSchema,
      regNo: fieldSchema,
      className: fieldSchema,
      session: fieldSchema,
      term: fieldSchema,
      photo: fieldSchema
    },
    
    // Subjects table with scores
    scoresTable: {
      headers: [subjectColumnSchema], // CA1, CA2, Exam, Total, Grade, Remark
      rowHeight: { type: Number, default: 30 },
      startY: { type: Number, required: true },
      subjectColumn: {
        x: { type: Number, required: true },
        width: { type: Number, required: true }
      }
    },
    
    // Affective traits section
    affective: {
      traits: [{ // punctuality, behaviour, neatness, etc.
        name: String,
        field: fieldSchema
      }]
    },
    
    // Fees section
    fees: {
      fields: [{ // tuition, uniform, books, etc.
        name: String,
        field: fieldSchema
      }]
    },
    
    // Attendance
    attendance: {
      opened: fieldSchema,
      present: fieldSchema,
      absent: fieldSchema
    },
    
    // Comments
    comments: {
      teacher: fieldSchema,
      principal: fieldSchema
    },
    
    // Signatures
    signatures: {
      teacher: fieldSchema,
      principal: fieldSchema
    },
    
    // Additional custom fields
    customFields: [fieldSchema]
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
resultTemplateSchema.index({ schoolId: 1, isActive: 1 });
resultTemplateSchema.index({ schoolId: 1, term: 1, session: 1 });

const ResultTemplate = mongoose.model('ResultTemplate', resultTemplateSchema);

export default ResultTemplate;