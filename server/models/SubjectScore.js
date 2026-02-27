// server/models/SubjectScore.js
// Stores per-subject scores entered by subject teachers.
// One document per (student + subject + term + session + schoolId).
// The class teacher's saveResult merges these into the Result document.

import mongoose from 'mongoose';

// Nigerian grading scale — A1 to F9
const getGrade = (total) => {
  if (total >= 75) return { grade: 'A1', remark: 'Excellent' };
  if (total >= 70) return { grade: 'B2', remark: 'Very Good' };
  if (total >= 65) return { grade: 'B3', remark: 'Good' };
  if (total >= 60) return { grade: 'C4', remark: 'Credit' };
  if (total >= 55) return { grade: 'C5', remark: 'Credit' };
  if (total >= 50) return { grade: 'C6', remark: 'Credit' };
  if (total >= 45) return { grade: 'D7', remark: 'Pass' };
  if (total >= 40) return { grade: 'E8', remark: 'Pass' };
  return             { grade: 'F9', remark: 'Fail' };
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
  // null = score not yet entered (distinct from 0 which is an explicit entry)
  // max is validated in the controller against the school's scoring scheme
  ca:        { type: Number, default: null },
  exam:      { type: Number, default: null },
  total:     { type: Number, default: null },
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