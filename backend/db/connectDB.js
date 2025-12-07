import mongoose from "mongoose";

export const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI);
		console.log(`MongoDB Connected: ${conn.connection.host}`);
		console.log('Using DB:', mongoose.connection.name);
	} catch (error) {
		console.log("Error connection to MongoDB:", error.message);
		process.exit(1);
	}
};
