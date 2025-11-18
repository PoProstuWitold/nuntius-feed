import { parseFeed } from '@rowanmanning/feed-parser'
import pLimit from 'p-limit'
import { Feed, type FeedDocument, Item } from '../models'
import type { FeedData, ItemData } from '../types'
import { curatedFeedLinks } from './feed-links'
import { GenericException } from './middlewares'

interface RefreshStatus {
	isRunning: boolean
	startedAt: Date | null
	finishedAt: Date | null
	total: number
	processed: number
	success: number
	failed: number
	logs: Array<{
		title: string
		status: 'success' | 'fail'
		message?: string
	}>
}

export const refreshProgress: RefreshStatus = {
	isRunning: false,
	startedAt: null,
	finishedAt: null,
	total: 0,
	processed: 0,
	success: 0,
	failed: 0,
	logs: []
}

export interface DefaultsStatus {
	isRunning: boolean
	startedAt: Date | null
	finishedAt: Date | null
	total: number
	processed: number
	created: number
	updated: number
	failed: number
	logs: Array<{
		feedLink: string
		status: 'created' | 'updated' | 'error'
		message?: string
	}>
}

export const defaultsProgress: DefaultsStatus = {
	isRunning: false,
	startedAt: null,
	finishedAt: null,
	total: 0,
	processed: 0,
	created: 0,
	updated: 0,
	failed: 0,
	logs: []
}

export class FeedUtils {
	// Method to validate feed URL
	static validateFeedUrl(url: string): boolean {
		const feedUrlPattern = /^(https?:\/\/[^\s]+)$/i
		return feedUrlPattern.test(url)
	}

	// Method to parse feed and return items
	static async parseFeed(feedUrl: string) {
		const response = await fetch(feedUrl)
		const feed = parseFeed(await response.text())
		const parsedItems = feed.items.map((item) => ({
			authors: item.authors,
			// Some feeds have literally "undefined" or "null" as string as categories
			categories: item.categories.filter(
				(cat) => cat.term !== 'undefined' && cat.term !== 'null'
			),
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
				categories: feed.categories.filter(
					(cat) => cat.term !== 'undefined' && cat.term !== 'null'
				),
				description: feed.description,
				copyright: feed.copyright,
				generator: feed.generator,
				image: feed.image,
				language: FeedUtils.getLanguageTag(feed.language, feedUrl),
				meta: feed.meta,
				published: feed.published || feed.updated || new Date(),
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
		} catch (_err) {
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
			updatedFeed.items = updatedItems.map((item) => item._id)
			await updatedFeed.save()

			return {
				updatedFeed,
				updatedItems
			}
		} catch (_err) {
			throw new GenericException({
				message: 'Error updating feed and items',
				statusCode: 400,
				name: 'Bad Request'
			})
		}
	}

	// biome-ignore lint: linter removes private static methods?
	private static getLanguageTag(
		rawLang: string | null | undefined,
		url: string
	): string {
		const ignoredTlds = ['com', 'org', 'net', 'info', 'gov', 'edu']
		const mappings: Record<string, string> = {
			pl: 'pl-PL',
			en: 'en-US',
			gb: 'en-GB',
			de: 'de-DE',
			fr: 'fr-FR',
			ru: 'ru-RU',
			it: 'it-IT',
			es: 'es-ES',
			uk: 'uk-UA',
			cz: 'cs-CZ',
			sk: 'sk-SK'
		}

		const lang = rawLang?.trim().toLowerCase() || ''

		// Normalize common lowercase full BCP47 codes like "en-gb" to "en-GB"
		if (/^[a-z]{2}-[a-z]{2}$/.test(lang)) {
			const [part1, part2] = lang.split('-')
			return `${part1}-${part2.toUpperCase()}`
		}

		// Short code mappings
		if (mappings[lang]) {
			return mappings[lang]
		}

		// Try to guess from TLD if still no lang
		if (!lang && url) {
			const hostname = new URL(url).hostname
			const tld = hostname.split('.').pop()?.toLowerCase()
			if (tld && !ignoredTlds.includes(tld)) {
				if (mappings[tld]) return mappings[tld]
				return `${tld}-${tld.toUpperCase()}`
			}
		}

		return lang ? `${lang}-${lang.toUpperCase()}` : 'und-UND'
	}

	static async refreshAllFeeds() {
		if (refreshProgress.isRunning) return
		refreshProgress.isRunning = true
		refreshProgress.startedAt = new Date()
		refreshProgress.finishedAt = null
		refreshProgress.logs = []
		refreshProgress.total = await Feed.countDocuments()
		refreshProgress.processed = 0
		refreshProgress.success = 0
		refreshProgress.failed = 0
		const feeds = await Feed.find()
		await processFeedBatch(feeds)
		refreshProgress.finishedAt = new Date()
		refreshProgress.isRunning = false
	}

	static async loadCuratedFeeds() {
		if (defaultsProgress.isRunning) return
		defaultsProgress.isRunning = true
		defaultsProgress.startedAt = new Date()
		defaultsProgress.finishedAt = null
		defaultsProgress.total = curatedFeedLinks.length
		defaultsProgress.processed = 0
		defaultsProgress.created = 0
		defaultsProgress.updated = 0
		defaultsProgress.failed = 0
		defaultsProgress.logs = []
		await processCuratedFeedBatch(curatedFeedLinks)
		defaultsProgress.finishedAt = new Date()
		defaultsProgress.isRunning = false
	}
}

async function processFeedBatch(feeds: FeedDocument[]) {
	const limit = pLimit(30)
	const tasks = feeds.map((feed) =>
		limit(async () => {
			try {
				const { parsedFeed, parsedItems } =
					await FeedUtils.getFeedWithItems(feed.self || '')
				await FeedUtils.updateFeedWithItems(
					feed,
					parsedFeed,
					parsedItems
				)
				refreshProgress.logs.push({
					title: feed.title || feed.self || '',
					status: 'success'
				})
				refreshProgress.success++
			} catch (err) {
				refreshProgress.logs.push({
					title: feed.title || feed.self || '',
					status: 'fail',
					message: (err as Error).message
				})
				refreshProgress.failed++
			} finally {
				refreshProgress.processed++
			}
		})
	)
	await Promise.allSettled(tasks)
}

async function processCuratedFeedBatch(feedLinks: string[]) {
	const limit = pLimit(30)
	const tasks = feedLinks.map((feedLink) =>
		limit(async () => {
			try {
				const { parsedFeed, parsedItems } =
					await FeedUtils.getFeedWithItems(feedLink)
				const existingFeed = await Feed.findOne({
					self: parsedFeed.self
				})
				if (existingFeed) {
					await FeedUtils.updateFeedWithItems(
						existingFeed,
						parsedFeed,
						parsedItems
					)
					defaultsProgress.updated++
					defaultsProgress.logs.push({ feedLink, status: 'updated' })
				} else {
					const feed = await Feed.create(parsedFeed)
					await Item.insertMany(
						parsedItems.map((item) => ({ ...item, feed: feed._id }))
					)
					defaultsProgress.created++
					defaultsProgress.logs.push({ feedLink, status: 'created' })
				}
			} catch (err) {
				defaultsProgress.failed++
				defaultsProgress.logs.push({
					feedLink,
					status: 'error',
					message: (err as Error).message
				})
			} finally {
				defaultsProgress.processed++
			}
		})
	)
	await Promise.allSettled(tasks)
}
