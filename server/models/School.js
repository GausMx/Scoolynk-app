import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  // School Profile Details
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  motto: { type: String }, // Added motto field

  // Unique Identifier & Admin Link
  schoolCode: { type: String, required: true, unique: true },
  adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // Academic Settings
  classes: [{ type: String }], // Array of class names/levels
  subjects: [{ type: String }], // Array of subject names
  gradingSystem: { type: String }, // e.g., A-F, 1-5, etc.
  termStart: { type: Date },
  termEnd: { type: Date },

  // Fee Settings
  defaultFee: { type: Number },
  lateFee: { type: Number },
});

// Pre-validation hook to generate a unique schoolCode if one is not provided
schoolSchema.pre('validate', async function (next) {
  if (!this.schoolCode) {
    let code;
    let exists = true;
    // Generate a unique 16-digit code
    while (exists) {
      code = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
      // Check if code already exists in the collection
      exists = await (mongoose.models.School ? mongoose.models.School.findOne({ schoolCode: code }) : false);
    }
    this.schoolCode = code;
  }
  next();
});

const School = mongoose.model('School', schoolSchema);
export default School;
