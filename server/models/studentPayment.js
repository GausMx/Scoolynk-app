import mongoose from 'mongoose';

const studentPaymentSchema = new mongoose.Schema({
	student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
	classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
	amount: { type: Number, required: true },
	status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
	dueDate: { type: Date },
	paidAt: { type: Date },
});

const StudentPayment = mongoose.model('StudentPayment', studentPaymentSchema);
export default StudentPayment;
