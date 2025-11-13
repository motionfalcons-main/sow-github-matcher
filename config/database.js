import mongoose from 'mongoose';

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    console.log('📦 Using existing MongoDB connection');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sow-matcher';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Continue without database - collections feature will be disabled
    console.log('⚠️ Running without database - collections feature disabled');
  }
}

export function isDatabaseConnected() {
  return isConnected;
}

