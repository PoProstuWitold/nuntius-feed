import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/feed'

export const connectDB = async () => {
	try {
		await mongoose.connect(MONGODB_URI)
		console.info('✅ MongoDB connected')
	} catch (err) {
		console.error('❌ MongoDB connection error:', err)
		process.exit(1)
	}
}
