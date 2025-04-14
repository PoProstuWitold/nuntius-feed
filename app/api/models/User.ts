import argon2 from 'argon2'
import {
	type Document,
	type HydratedDocument,
	Schema,
	type Types,
	model,
	models
} from 'mongoose'
import type { ChannelDocument } from './Channel'

export interface UserDocument extends Document {
	name: string
	email: string
	password: string
	role: 'user' | 'admin'
	channels: (Types.ObjectId | ChannelDocument)[]
	verifyPassword: (inputPassword: string) => Promise<boolean>
}

const UserSchema = new Schema<UserDocument>(
	{
		name: { type: String, required: true, unique: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		role: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user'
		},
		channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }]
	},
	{
		timestamps: true
	}
)

UserSchema.pre('save', async function (next) {
	const user = this as HydratedDocument<UserDocument>
	if (!user.isModified('password')) return next()
	user.password = await argon2.hash(user.password)
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
