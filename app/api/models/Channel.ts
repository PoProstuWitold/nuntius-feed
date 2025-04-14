import {
	type Document,
	InferSchemaType,
	Schema,
	type Types,
	model,
	models
} from 'mongoose'

// Official RSS 2.0 Specification:
// https://www.rssboard.org/rss-specification

// Validation rules for RSS 2.0:
// https://validator.w3.org/feed/docs/rss2.html
export type ChannelImage = {
	url: string
	title: string
	link: string
}

export interface ChannelData {
	// custom
	channelLink: string // The URL of the RSS channel
	// required
	title: string // The title of the channel
	link: string // The URL of the channel
	description: string // The description of the channel
	// optional
	language?: string // The language of the channel, e.g., "en-us", "pl", "pl-pl"
	copyright?: string // The copyright of the channel
	managingEditor?: string // The email address of the managing editor
	webMaster?: string // The email address of the web master
	pubDate?: Date // The publication date of the channel
	lastBuildDate?: Date // The last build date of the channel
	category?: string // The category of the channel
	generator?: string // The generator of the channel
	docs?: string // The URL of the documentation for the channel
	cloud?: string // The cloud of the channel
	ttl?: number // The time to live of the channel
	image?: ChannelImage // The image of the channel
}

export interface ChannelDocument extends ChannelData, Document {}

const ChannelSchema = new Schema<ChannelDocument>(
	{
		// custom
		channelLink: { type: String, required: true, unique: true },
		// required
		title: { type: String, required: true },
		link: { type: String, required: true, unique: true },
		description: { type: String, required: true },
		// custom
		language: { type: String },
		copyright: { type: String },
		managingEditor: { type: String },
		webMaster: { type: String },
		pubDate: { type: Date },
		lastBuildDate: { type: Date },
		category: { type: String },
		generator: { type: String },
		docs: { type: String },
		cloud: { type: String },
		ttl: { type: Number },
		image: {
			type: {
				url: String,
				title: String,
				link: String
			}
		}
	},
	{
		timestamps: true
	}
)

ChannelSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: (_, ret) => {
		ret.id = ret._id
		ret._id = undefined
	}
})

// To query/sort by freshness
ChannelSchema.index({ lastBuildDate: -1 })

export const Channel =
	models.Channel || model<ChannelDocument>('Channel', ChannelSchema)
