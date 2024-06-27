// src/lib/testMongoConnection.js
import connectMongo from "./mongoose";

const testMongoConnection = async () => {
  try {
    await connectMongo();
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  }
};

testMongoConnection();
