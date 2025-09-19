// server/config/db.js

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // This is where your MongoDB connection string from the .env file is used.
    // It is crucial for connecting to your database.
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // The options useCreateIndex and useFindAndModify are no longer supported
      // in newer versions of Mongoose and have been removed.
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit with a non-zero status code to indicate an error
  }
};  

export default connectDB;
