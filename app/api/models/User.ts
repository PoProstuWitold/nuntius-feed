import argon2 from 'argon2'
import {
	type Document,
	type HydratedDocument,
	model,
	models,
	Schema,
	type Types
} from 'mongoose'
import type { FeedDocument } from './Feed'
import type { ItemDocument } from './Item'

export interface UserDocument extends Document {
	name: string
	email: string
	password: string
	role: 'user' | 'admin'
	subscriptions: (Types.ObjectId | FeedDocument)[]
	favorites: (Types.ObjectId | ItemDocument)[]
	verifyPassword: (inputPassword: string) => Promise<boolean>
	isSubscribedTo: (feedId: Types.ObjectId | string) => boolean
	isFavorite: (itemId: Types.ObjectId | string) => boolean
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
		subscriptions: [{ type: Schema.Types.ObjectId, ref: 'Feed' }],
		favorites: [{ type: Schema.Types.ObjectId, ref: 'Item' }]
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

UserSchema.methods.isSubscribedTo = function (feedId: Types.ObjectId | string) {
	return this.subscriptions.some(
		(subId: Types.ObjectId | FeedDocument) =>
			subId.toString() === feedId.toString()
	)
}

UserSchema.methods.isFavorite = function (itemId: Types.ObjectId | string) {
	return this.favorites.some(
		(favId: Types.ObjectId | ItemDocument) =>
			favId.toString() === itemId.toString()
	)
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
