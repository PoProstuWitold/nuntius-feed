import { parseFeed } from '@rowanmanning/feed-parser'
import { Feed, type FeedDocument, Item } from '../models'
import type { FeedData, ItemData } from '../types'
import { GenericException } from './middlewares'

export class FeedUtils {
	// Function to validate feed URL
	static validateFeedUrl(url: string): boolean {
		const feedUrlPattern = /^(https?:\/\/[^\s]+)$/i
		return feedUrlPattern.test(url)
	}

	// Function to parse feed and return items
	static async parseFeed(feedUrl: string) {
		const response = await fetch(feedUrl)
		const feed = parseFeed(await response.text())
		const parsedItems = feed.items.map((item) => ({
			authors: item.authors,
			categories: item.categories,
			content: item.content,
			description: item.description,
			guid: item.id,
			image: item.image,
			media: item.media,
			published: item.published,
			title: item.title,
			updated: item.updated,
			url: item.url
		}))
		return {
			parsedFeed: {
				authors: feed.authors,
				categories: feed.categories,
				description: feed.description,
				copyright: feed.copyright,
				generator: feed.generator,
				image: feed.image,
				language: feed.language,
				meta: feed.meta,
				published: feed.published,
				title: feed.title,
				self: feed.self || feedUrl,
				updated: feed.updated,
				url: feed.url
			} as FeedData,
			parsedItems
		}
	}

	// Method to get the feed items
	static async getFeedWithItems(feedLink: string) {
		try {
			const isFeedLinkValid = FeedUtils.validateFeedUrl(feedLink)
			if (!isFeedLinkValid) {
				throw new GenericException({
					message: 'Invalid feed URL',
					statusCode: 400
				})
			}

			const { parsedFeed, parsedItems } =
				await FeedUtils.parseFeed(feedLink)

			return {
				parsedFeed,
				parsedItems
			}
		} catch (err) {
			throw new GenericException({
				message: 'Error parsing feed',
				statusCode: 400,
				name: 'Bad Request'
			})
		}
	}

	static async updateFeedWithItems(
		existingFeed: FeedDocument,
		parsedFeed: FeedData,
		parsedItems: Omit<ItemData, 'feed'>[]
	) {
		try {
			const updatedFeed = await Feed.findByIdAndUpdate(
				existingFeed._id,
				{
					...parsedFeed,
					$set: {
						lastBuildDate: new Date()
					}
				},
				{ new: true }
			)

			const updatedItems = await Promise.all(
				parsedItems.map((item) =>
					Item.findOneAndUpdate(
						{ guid: item.guid, feed: existingFeed._id },
						{ ...item, feed: updatedFeed._id },
						{ upsert: true, new: true, setDefaultsOnInsert: true }
					)
				)
			)
			return {
				updatedFeed,
				updatedItems
			}
		} catch (err) {
			throw new GenericException({
				message: 'Error updating feed and items',
				statusCode: 400,
				name: 'Bad Request'
			})
		}
	}
}
