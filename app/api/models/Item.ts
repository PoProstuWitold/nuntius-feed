import { type Document, Schema, type Types, model, models } from 'mongoose'

// Official RSS 2.0 Specification:
// https://www.rssboard.org/rss-specification

// Validation rules for RSS 2.0:
// https://validator.w3.org/feed/docs/rss2.html
export type ItemEnclosure = {
	url: string
	length?: number
	type?: string
}

export interface ItemData {
	// custom
	channel: Types.ObjectId
	// required
	title: string // The title of the item
	link: string // The URL of the item
	description: string // The description of the item
	// optional
	author?: string // The author of the item
	category?: string // The category of the item
	enclosure?: ItemEnclosure // The enclosure of the item
	guid?: string // The globally unique identifier of the item
	pubDate?: Date | string // The publication date of the item
	source?: string // The source of the item
}

export interface ItemDocument extends ItemData, Document {}

const ItemSchema = new Schema<ItemDocument>(
	{
		// custom
		channel: {
			type: Schema.Types.ObjectId,
			ref: 'Channel',
			required: true
		},
		// required
		title: { type: String, required: true },
		description: { type: String, required: true },
		link: { type: String, required: true },
		// optional
		author: { type: String },
		category: { type: String },
		enclosure: {
			url: { type: String, required: true },
			length: { type: Number },
			type: { type: String }
		},
		guid: { type: String, unique: true },
		pubDate: { type: Date },
		source: { type: String }
	},
	{
		timestamps: true
	}
)

ItemSchema.index({ pubDate: -1 })

ItemSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: (_, ret) => {
		ret.id = ret._id
		ret._id = undefined
	}
})

export const Item = models.Item || model<ItemDocument>('Item', ItemSchema)
