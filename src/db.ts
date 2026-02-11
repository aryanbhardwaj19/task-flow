import mongoose from "mongoose";

export async function connectDB() {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL must be set");
  }

  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}
