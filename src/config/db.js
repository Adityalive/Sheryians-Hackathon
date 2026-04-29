import mongoose from 'mongoose';

export const isDbReady = () => mongoose.connection.readyState === 1;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.DB_URI;

  if (!uri) {
    console.warn('MongoDB URI not set. Starting in memory-backed mode.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.warn('Continuing without a live database connection.');
    return null;
  }
};

export default connectDB;
