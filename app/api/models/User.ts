import argon2 from 'argon2'
import { type Document, Schema, model, models } from 'mongoose'

export interface UserDocument extends Document {
	name: string
	email: string
	password: string
	verifyPassword: (inputPassword: string) => Promise<boolean>
}

const UserSchema = new Schema<UserDocument>(
	{
		name: { type: String, required: true, unique: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true }
	},
	{
		timestamps: true
	}
)

UserSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next()
	this.password = await argon2.hash(this.password)
	next()
})

UserSchema.methods.verifyPassword = async function (inputPassword: string) {
	return await argon2.verify(this.password, inputPassword)
}

UserSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: (_, ret) => {
		ret.id = ret._id
		ret._id = undefined
	}
})

export const User = models.User || model<UserDocument>('User', UserSchema)
