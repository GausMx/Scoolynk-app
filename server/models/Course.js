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
     type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
     required: false
   },
classes: [
    {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Class'
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
