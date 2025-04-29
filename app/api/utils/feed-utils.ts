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
			guid: item.id || item.url,
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
				language: FeedUtils.getLanguageTag(feed.language, feedUrl),
				meta: feed.meta,
				published: feed.published,
				title: feed.title,
				self: feedUrl,
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

	private static getLanguageTag(
		rawLang: string | null | undefined,
		url: string
	): string {
		const ignoredTlds = ['com', 'org', 'net', 'info', 'gov', 'edu']

		let lang = rawLang?.toLowerCase() ?? ''

		if (!lang && url) {
			const hostname = new URL(url).hostname
			const tld = hostname.split('.').pop()?.toLowerCase()
			if (tld && !ignoredTlds.includes(tld)) lang = tld
		}

		if (!lang) return 'und-UND'

		// Normalize common 2-letter codes to full BCP47
		const mappings: Record<string, string> = {
			pl: 'pl-PL',
			en: 'en-US',
			de: 'de-DE',
			fr: 'fr-FR',
			ru: 'ru-RU',
			it: 'it-IT',
			es: 'es-ES',
			uk: 'uk-UA',
			cz: 'cs-CZ',
			sk: 'sk-SK'
		}

		// If already full format, return as-is
		if (/^[a-z]{2}-[A-Z]{2}$/.test(lang)) return lang

		// Try mapping
		return mappings[lang] || `${lang}-${lang.toUpperCase()}`
	}
}
