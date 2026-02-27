import mongoose from 'mongoose';

// ─── Grade helper (Nigerian scale) ───────────────────────────────────────────
const getGrade = (total) => {
  if (total >= 75) return { grade: 'A1', remark: 'EXCELLENT' };
  if (total >= 70) return { grade: 'B2', remark: 'VERY GOOD' };
  if (total >= 65) return { grade: 'B3', remark: 'GOOD' };
  if (total >= 60) return { grade: 'C4', remark: 'CREDIT' };
  if (total >= 55) return { grade: 'C5', remark: 'CREDIT' };
  if (total >= 50) return { grade: 'C6', remark: 'CREDIT' };
  if (total >= 45) return { grade: 'D7', remark: 'PASS' };
  if (total >= 40) return { grade: 'E8', remark: 'PASS' };
  return             { grade: 'F9', remark: 'FAIL' };
};

// ─── Subject Schema ───────────────────────────────────────────────────────────
const subjectSchema = new mongoose.Schema({
  subject:        { type: String, required: true },

  // New: single CA field (out of 40) — preferred going forward
  ca:             { type: Number, default: 0, min: 0, max: 40 },

  // Legacy: ca1 + ca2 each out of 20 — kept for backward compatibility
  ca1:            { type: Number, default: 0, min: 0, max: 20 },
  ca2:            { type: Number, default: 0, min: 0, max: 20 },

  exam:           { type: Number, default: 0, min: 0, max: 60 },
  total:          { type: Number },
  grade:          { type: String },
  remark:         { type: String },

  // Cumulative / cross-term columns (filled by admin or calculation)
  term1Total:     { type: Number },
  term2Total:     { type: Number },
  sessionAverage: { type: Number },
  classAverage:   { type: Number },
  classPosition:  { type: Number },
  annual:         { type: Number },
}, { _id: false });

// ─── Result Schema ────────────────────────────────────────────────────────────
const resultSchema = new mongoose.Schema({

  // ── References ──────────────────────────────────────────────────────────────
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // ── Term / Session ──────────────────────────────────────────────────────────
  term: {
    type: String,
    enum: ['First Term', 'Second Term', 'Third Term'],
    required: true,
  },
  session: {
    type: String,
    required: true, // e.g. "2024/2025"
  },

  // ── Academic Dates ──────────────────────────────────────────────────────────
  termBegins:          { type: Date },
  termEnds:            { type: Date },
  nextTermResumption:  { type: Date },

  // ── Subjects ────────────────────────────────────────────────────────────────
  subjects: [subjectSchema],

  // ── Affective Domain (10 traits, rated 1-5) ─────────────────────────────────
  affectiveTraits: {
    attentiveness:   { type: Number, min: 1, max: 5, default: 3 },
    honesty:         { type: Number, min: 1, max: 5, default: 3 },
    neatness:        { type: Number, min: 1, max: 5, default: 3 },
    politeness:      { type: Number, min: 1, max: 5, default: 3 },
    punctuality:     { type: Number, min: 1, max: 5, default: 3 },
    selfControl:     { type: Number, min: 1, max: 5, default: 3 },
    obedience:       { type: Number, min: 1, max: 5, default: 3 },
    reliability:     { type: Number, min: 1, max: 5, default: 3 },
    responsibility:  { type: Number, min: 1, max: 5, default: 3 },
    relationship:    { type: Number, min: 1, max: 5, default: 3 },
    // Psychomotor Domain (6 skills, rated 1-5)
    handlingOfTools: { type: Number, min: 1, max: 5, default: 3 },
    drawingPainting: { type: Number, min: 1, max: 5, default: 3 },
    handwriting:     { type: Number, min: 1, max: 5, default: 3 },
    publicSpeaking:  { type: Number, min: 1, max: 5, default: 3 },
    speechFluency:   { type: Number, min: 1, max: 5, default: 3 },
    sportsGames:     { type: Number, min: 1, max: 5, default: 3 },
  },

  // ── School Fees ─────────────────────────────────────────────────────────────
  fees: {
    tuition: { type: Number, default: 0 },
    uniform: { type: Number, default: 0 },
    books:   { type: Number, default: 0 },
    lesson:  { type: Number, default: 0 },
    other:   { type: Number, default: 0 },
  },

  // ── Attendance ──────────────────────────────────────────────────────────────
  attendance: {
    opened:  { type: Number, default: 0 },
    present: { type: Number, default: 0 },
    absent:  { type: Number, default: 0 },
  },

  // ── Comments ────────────────────────────────────────────────────────────────
  comments: {
    teacher:   { type: String, default: '' },
    principal: { type: String, default: '' },
  },

  // ── Overall Performance (auto-calculated in pre-save) ───────────────────────
  overallTotal:    { type: Number },
  overallAverage:  { type: Number },
  overallGrade:    { type: String },
  overallPosition: { type: Number },
  classSize:       { type: Number, default: 0 },

  // ── PDF Storage ─────────────────────────────────────────────────────────────
  pdfBase64:            { type: String, default: null },
  filledTemplateImage:  { type: String, default: null },

  // ── Workflow Status ─────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'sent', 'verified'],
    default: 'draft',
  },
  submittedAt:   { type: Date },
  reviewedAt:    { type: Date },
  sentToParentAt:{ type: Date },
  approvedAt:    { type: Date },
  rejectedAt:    { type: Date },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectionReason: { type: String },

  // ── Names on result sheet ───────────────────────────────────────────────────
  teacherName:   { type: String, default: '' },
  principalName: { type: String, default: '' },

  // ── Extra student fields filled by teacher on the sheet ─────────────────────
  studentExtras: {
    gender: { type: String, default: '' },
    dob:    { type: String, default: '' },
    club:   { type: String, default: '' },
  },

  // ── OCR Scan Metadata ───────────────────────────────────────────────────────
  wasScanned: { type: Boolean, default: false },
  scanData: {
    scannedAt:  Date,
    rawText:    String,
    confidence: Number,
  },

}, { timestamps: true });

// ─── Indexes ──────────────────────────────────────────────────────────────────
resultSchema.index({ student: 1, term: 1, session: 1 });
resultSchema.index({ schoolId: 1, term: 1, session: 1 });
resultSchema.index({ classId: 1, term: 1, session: 1 });
resultSchema.index({ teacher: 1, status: 1 });
resultSchema.index({ status: 1 });
resultSchema.index({ schoolId: 1, classId: 1, term: 1, session: 1, status: 1 });

// ─── Pre-save: calculate totals, grades, overall performance ─────────────────
resultSchema.pre('save', function(next) {
  this.subjects.forEach(subject => {
    // Support both ca (new, out of 40) and ca1+ca2 (legacy, each out of 20)
    // If ca is explicitly set and non-zero, use it; otherwise fall back to ca1+ca2
    const caScore = (subject.ca && subject.ca > 0)
      ? subject.ca
      : (subject.ca1 || 0) + (subject.ca2 || 0);

    subject.total = caScore + (subject.exam || 0);

    const { grade, remark } = getGrade(subject.total);
    subject.grade  = grade;
    subject.remark = remark;
  });

  if (this.subjects.length > 0) {
    this.overallTotal   = this.subjects.reduce((sum, s) => sum + (s.total || 0), 0);
    this.overallAverage = Math.round(
      (this.overallTotal / (this.subjects.length * 100)) * 100
    );
    this.overallGrade = getGrade(this.overallAverage).grade;
  }

  next();
});

// ─── Static: recalculate class positions after approve/verify ────────────────
resultSchema.statics.calculateClassPositions = async function(classId, term, session, schoolId) {
  if (!schoolId) {
    throw new Error('schoolId is required for calculateClassPositions');
  }

  console.log('[CalculateClassPositions] Starting for:', { classId, term, session, schoolId });

  // Include ALL statuses so position is visible immediately on save,
  // not just after admin approval.
  const results = await this.find({
    classId,
    term,
    session,
    schoolId,
    status: { $in: ['draft', 'submitted', 'approved', 'sent', 'verified', 'rejected'] },
  }).sort({ overallTotal: -1 });

  console.log('[CalculateClassPositions] Found', results.length, 'results to rank');

  for (let i = 0; i < results.length; i++) {
    results[i].overallPosition = i + 1;
    await results[i].save();
  }

  console.log('[CalculateClassPositions] Positions updated successfully');
  return results.length;
};

const Result = mongoose.model('Result', resultSchema);

export default Result;