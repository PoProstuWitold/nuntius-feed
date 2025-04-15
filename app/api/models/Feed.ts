import { type Document, Schema, model, models } from 'mongoose'
import type { FeedData } from '../types'

export const FeedAuthorSchema = new Schema(
	{
		email: String,
		name: String,
		url: String
	},
	{ _id: false }
)

export const FeedCategorySchema = new Schema(
	{
		label: String,
		term: { type: String, required: true },
		url: String
	},
	{ _id: false }
)

const FeedGeneratorSchema = new Schema(
	{
		label: String,
		url: String,
		version: String
	},
	{ _id: false }
)

export const FeedImageSchema = new Schema(
	{
		title: String,
		url: { type: String, required: true }
	},
	{ _id: false }
)

const FeedMetaSchema = new Schema(
	{
		type: { type: String, enum: ['atom', 'rss'], required: true },
		version: {
			type: String,
			enum: ['0.3', '0.9', '1.0', '2.0'],
			required: true
		}
	},
	{ _id: false }
)

export interface FeedDocument extends FeedData, Document {}
const FeedSchema = new Schema<FeedDocument>(
	{
		authors: { type: [FeedAuthorSchema], default: [] },
		categories: { type: [FeedCategorySchema], default: [] },
		copyright: String,
		description: String,
		generator: { type: FeedGeneratorSchema, default: null },
		image: { type: FeedImageSchema, default: null },
		items: [{ type: Schema.Types.ObjectId, ref: 'FeedItem' }],
		language: String,
		meta: { type: FeedMetaSchema, required: true },
		published: Date,
		self: String,
		title: String,
		updated: Date,
		url: String
	},
	{ timestamps: true }
)

FeedSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: (_, ret) => {
		ret.id = ret._id
		ret._id = undefined
	}
})

// To query/sort by freshness
FeedSchema.index({ lastBuildDate: -1 })

export const Feed = models.Feed || model<FeedDocument>('Feed', FeedSchema)
