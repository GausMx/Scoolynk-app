// server/models/SubjectScore.js
// Stores per-subject scores entered by subject teachers.
// One document per (student + subject + term + session + schoolId).
// The class teacher's saveResult merges these into the Result document.

import mongoose from 'mongoose';

// Matches the grade helper in Result.js exactly
const getGrade = (total) => {
  if (total >= 95) return { grade: 'A+', remark: 'Exceptional' };
  if (total >= 90) return { grade: 'A',  remark: 'Distinction' };
  if (total >= 85) return { grade: 'A-', remark: 'Excellent' };
  if (total >= 80) return { grade: 'B+', remark: 'Very Good' };
  if (total >= 75) return { grade: 'B',  remark: 'Very Good' };
  if (total >= 70) return { grade: 'B-', remark: 'Below Standard' };
  if (total >= 60) return { grade: 'C',  remark: 'Good' };
  if (total >= 40) return { grade: 'D',  remark: 'Average' };
  return             { grade: 'F',  remark: 'Fail' };
};

const subjectScoreSchema = new mongoose.Schema({
  // ── References ──────────────────────────────────────────────────────────────
  student:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student',  required: true },
  classId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Class',    required: true },
  schoolId:  { type: mongoose.Schema.Types.ObjectId, ref: 'School',   required: true },
  teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },

  // ── Term identity ────────────────────────────────────────────────────────────
  term:      { type: String, enum: ['First Term', 'Second Term', 'Third Term'], required: true },
  session:   { type: String, required: true },

  // ── Subject & scores ─────────────────────────────────────────────────────────
  subject:   { type: String, required: true, trim: true },
  ca:        { type: Number, default: 0, min: 0, max: 40 },   // single CA (out of 40)
  exam:      { type: Number, default: 0, min: 0, max: 60 },
  total:     { type: Number },
  grade:     { type: String },
  remark:    { type: String },

}, { timestamps: true });

// ── Unique constraint: one score per student per subject per term/session ──────
subjectScoreSchema.index(
  { student: 1, subject: 1, term: 1, session: 1, schoolId: 1 },
  { unique: true }
);

// ── Useful lookup indexes ──────────────────────────────────────────────────────
subjectScoreSchema.index({ classId: 1, subject: 1, term: 1, session: 1 });
subjectScoreSchema.index({ teacher: 1, term: 1, session: 1 });
subjectScoreSchema.index({ schoolId: 1, classId: 1, term: 1, session: 1 });

// ── Pre-save: auto-calculate total, grade, remark ─────────────────────────────
subjectScoreSchema.pre('save', function (next) {
  this.total = (this.ca || 0) + (this.exam || 0);
  const { grade, remark } = getGrade(this.total);
  this.grade  = grade;
  this.remark = remark;
  next();
});

const SubjectScore = mongoose.model('SubjectScore', subjectScoreSchema);
export default SubjectScore;