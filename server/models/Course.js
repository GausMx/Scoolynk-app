// models/Course.js
import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    teacher: {
      type: String,
      required: false,
      trim: true
    },
    classes: [
      {
        type: String, // could also be ObjectId if you link to Class model
        required: true
      }
    ],
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true
    },
  },
  { timestamps: true }
);
const Course = mongoose.model('Course', CourseSchema);
export default Course;
