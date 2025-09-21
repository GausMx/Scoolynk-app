import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
	student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
	classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
	subject: { type: String, required: true },
	grade: { type: String, required: true },
	status: { type: String, enum: ['draft', 'submitted', 'verified'], default: 'draft' },
	teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	createdAt: { type: Date, default: Date.now },
});

const Result = mongoose.model('Result', resultSchema);
export default Result;
