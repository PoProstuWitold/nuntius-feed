import type { Types } from 'mongoose'

export interface PayloadUser {
	sub: string
	name: string
	email: string
}

export type Env = {
	Variables: {
		user: PayloadUser | null
	}
}

// Feeds
export interface FeedAuthor {
	email: string | null // The author's email address.
	name: string | null // The author's name.
	url: string | null // A URL pointing to a representation of the author on the internet.
}

export interface FeedCategory {
	label: string | null // The category display label.
	term: string // The category identifier. Often the same as the label.
	url: string | null // A URL pointing to a representation of the category on the internet.
}

export interface FeedGenerator {
	label: string | null // The name of the software that generated the feed.
	url: string | null // A URL pointing to further information about the generator.
	version: string | null // The version of the software used to generate the feed.
}

export interface FeedImage {
	title: string | null // The alternative text of the image.
	url: string // The image URL.
}

export interface FeedMeta {
	type: 'atom' | 'rss' // The name of the type of feed.
	version: '0.3' | '0.9' | '1.0' | '2.0' // The version of the type of feed.
}

export interface FeedItemMedia {
	image: string | null // A URL pointing to an image representation of the media. E.g. a video cover image.
	length: number | null // A length of the media in bytes.
	mimetype?: string | null // The full mime type of the media (e.g. `image/jpeg`).
	title: string | null // The title of the media.
	type: string | null // The type of the media (the first part of the mime type, e.g. `audio` or `image`).
	url: string // A URL pointing to the media.
}

// Represents an RSS or Atom feed
export interface FeedData {
	authors: FeedAuthor[] // The feed authors. Always an array but sometimes empty if no authors are found.
	categories: FeedCategory[] // The feed categories. Always an array but sometimes empty if no categories are found.
	copyright: string | null // The feed's copyright notice.
	description: string | null // A short description of the feed.
	generator: FeedGenerator | null // The software that generated the feed.
	image: FeedImage | null // An image representing the feed.
	items: ItemData[] // The content items in the feed. Always an array but sometimes empty if no items are found.
	language: string | null // The language the feed is written in.
	meta: FeedMeta // Meta information about the format of the feed.
	published: Date | null // The date the feed was last published.
	self: string | null // A URL pointing to the feed itself.
	title: string | null // The name of the feed.
	updated: Date | null // The date the feed was last updated at.
	url: string | null // A URL pointing to the HTML web page that this feed is for.
}

export interface ItemData {
	feed: Types.ObjectId // The ID of the feed this item belongs to.
	authors: FeedAuthor[] // The feed item authors. Always an array but sometimes empty if no authors are found.
	categories: FeedCategory[] // The feed item categories. Always an array but sometimes empty if no categories are found.
	content: string | null // The feed item content.
	description: string | null // A short description of the feed item.
	guid: string | null // A unique identifier for the feed item.
	image: FeedImage | null // An image representing the feed item.
	media: FeedItemMedia[] // Media associated with the feed item. Always an array but sometimes empty if no items are found.
	published: Date | null // The date the feed item was last published.
	title: string | null // The title of the feed item.
	updated: Date | null // The date the feed item was last updated at.
	url: string | null // A URL pointing to the HTML web page that this feed item represents.
}
