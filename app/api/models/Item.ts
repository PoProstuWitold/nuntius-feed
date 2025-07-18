import { type Document, model, models, Schema } from 'mongoose'
import type { ItemData } from '../types'
import { FeedAuthorSchema, FeedCategorySchema, FeedImageSchema } from './Feed'

const FeedItemMediaSchema = new Schema(
	{
		image: String,
		length: Number,
		mimetype: String,
		title: String,
		type: String,
		url: { type: String, required: true }
	},
	{ _id: false }
)

export interface ItemDocument extends ItemData, Document {}
const ItemSchema = new Schema<ItemDocument>(
	{
		feed: {
			type: Schema.Types.ObjectId,
			ref: 'Feed',
			required: true
		},
		guid: { type: String, required: true },
		authors: { type: [FeedAuthorSchema], default: [] },
		categories: { type: [FeedCategorySchema], default: [] },
		content: String,
		description: String,
		image: { type: FeedImageSchema, default: null },
		media: { type: [FeedItemMediaSchema], default: [] },
		published: Date,
		title: String,
		updated: Date,
		url: String
	},
	{ timestamps: true }
)

ItemSchema.index({ pubDate: -1 })
ItemSchema.index({ guid: 1, feed: 1 }, { unique: true })

ItemSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: (_, ret) => {
		ret.id = ret._id
		ret._id = undefined
	}
})

export const Item = models.Item || model<ItemDocument>('Item', ItemSchema)
