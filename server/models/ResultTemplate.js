// server/models/ResultTemplate.js - UPDATED FOR VISUAL BUILDER

import mongoose from 'mongoose';

const resultTemplateSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  name: {
    type: String,
    required: true
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
  
  // Template type: 'visual' (form-based) or 'image' (coordinate-based - legacy)
  templateType: {
    type: String,
    enum: ['visual', 'image'],
    default: 'visual'
  },

  // ✅ NEW: Component-based structure for visual builder
  components: {
    // School header section
    header: {
      enabled: { type: Boolean, default: true }
    },
    
    // Student information
    studentInfo: {
      enabled: { type: Boolean, default: true }
    },
    
    // Subject scores table
    scoresTable: {
      enabled: { type: Boolean, default: true },
      columns: [{
        name: String, // e.g., "CA1", "CA2", "Exam", "Total", "Grade"
        maxScore: Number, // Maximum possible score
        enabled: Boolean,
        editable: Boolean, // False for calculated fields like Total/Grade
        calculated: Boolean // True for auto-calculated fields
      }],
      defaultSubjects: { type: Number, default: 12 } // Default number of subject rows
    },
    
    // Affective traits
    affectiveTraits: {
      enabled: { type: Boolean, default: true },
      traits: [{
        name: String, // e.g., "Punctuality", "Behaviour"
        enabled: Boolean
      }]
    },
    
    // School fees
    fees: {
      enabled: { type: Boolean, default: true },
      types: [{
        name: String, // e.g., "Tuition", "Uniform"
        enabled: Boolean
      }]
    },
    
    // Attendance
    attendance: {
      enabled: { type: Boolean, default: true }
    },
    
    // Comments
    comments: {
      enabled: { type: Boolean, default: true },
      teacher: { type: Boolean, default: true },
      principal: { type: Boolean, default: true }
    },
    
    // Signatures
    signatures: {
      enabled: { type: Boolean, default: false }
    }
  },

  // ⚠️ LEGACY: Keep for backward compatibility with old image-based templates
  templateImage: {
    type: String, // Base64 encoded image (for old system)
    default: null
  },
  
  layout: {
    type: mongoose.Schema.Types.Mixed, // For old coordinate-based system
    default: null
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
resultTemplateSchema.index({ schoolId: 1, term: 1, session: 1, isActive: 1 });

const ResultTemplate = mongoose.model('ResultTemplate', resultTemplateSchema);

export default ResultTemplate;