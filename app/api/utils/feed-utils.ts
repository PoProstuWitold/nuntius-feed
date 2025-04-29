import { parseFeed } from '@rowanmanning/feed-parser'
import { Feed, type FeedDocument, Item } from '../models'
import type { FeedData, ItemData } from '../types'
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

	static async refreshAllFeeds() {
		if (refreshProgress.isRunning) return // zapobiegamy równoległym runom

		refreshProgress.isRunning = true
		refreshProgress.startedAt = new Date()
		refreshProgress.finishedAt = null
		refreshProgress.logs = []
		refreshProgress.total = 0
		refreshProgress.processed = 0
		refreshProgress.success = 0
		refreshProgress.failed = 0

		const feeds = await Feed.find({})
		refreshProgress.total = feeds.length

		for (const feed of feeds) {
			try {
				const { parsedFeed, parsedItems } =
					await FeedUtils.getFeedWithItems(feed.self)

				await FeedUtils.updateFeedWithItems(
					feed,
					parsedFeed,
					parsedItems
				)

				refreshProgress.logs.push({
					title: feed.title || feed.self,
					status: 'success'
				})
				refreshProgress.success++
			} catch (err) {
				refreshProgress.logs.push({
					title: feed.title || feed.self,
					status: 'fail',
					message: (err as Error).message
				})
				refreshProgress.failed++
			}

			refreshProgress.processed++
		}

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

		for (const feedLink of curatedFeedLinks) {
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
			}

			defaultsProgress.processed++
		}

		defaultsProgress.finishedAt = new Date()
		defaultsProgress.isRunning = false
	}
}

export const curatedFeedLinks = [
	...new Set([
		// World
		'https://feeds.bbci.co.uk/news/world/rss.xml',
		'https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/section/world/rss.xml',
		'https://www.watchdoguganda.com/feed',
		'https://www.scmp.com/rss/91/feed',
		'https://www.spiegel.de/international/index.rss',
		'https://www.vox.com/rss/index.xml',
		'https://www.theguardian.com/world/rss',
		'https://techcrunch.com/feed/',
		'https://www.theverge.com/rss/index.xml',
		'https://www.rollingstone.com/feed/',
		'https://rt.com/rss/',
		'https://www.themoscowtimes.com/rss/news',
		'https://tealtech.com/feed/',
		'https://www.artnews.com/feed/',
		'https://spectrum.ieee.org/rss/blog/tech-talk/fulltext',
		'https://www.wired.com/feed',
		'https://feeds.npr.org/1045/rss.xml',
		'https://www.rogerebert.com/feed',
		'http://rss.cnn.com/rss/edition_sport.rss',
		'https://feeds.npr.org/1008/rss.xml',
		'https://feeds.feedburner.com/RaksKitchen',
		'https://www.babypips.com/feed.rss',
		'https://feeds.feedburner.com/BeMyTravelMuse',
		'https://feeds.feedburner.com/Theblondeabroad/ScWo',
		'https://feeds.feedburner.com/craftbeercom',
		// Poland
		'https://www.polsatnews.pl/rss/wszystkie.xml',
		'https://www.polsatnews.pl/rss/polska.xml',
		'https://www.polsatnews.pl/rss/swiat.xml',
		'https://tygodnik.interia.pl/feed',
		'https://www.polsatnews.pl/rss/biznes.xml',
		'https://feeds.feedburner.com/media2',
		'https://natemat.pl/rss/wszystkie',
		'https://defence24.pl/_rss',
		'https://spidersweb.pl/api/post/feed/feed-gn',
		'https://businessinsider.com.pl/.feed',
		'https://www.pudelek.pl/rss2.xml',
		'https://next.gazeta.pl/pub/next/rssnext.htm',
		'https://www.tvn24.pl/najnowsze.xml',
		'https://www.tvn24.pl/najwazniejsze.xml',
		'https://www.tvn24.pl/internet-hi-tech-media,40.xml',
		'https://www.tvn24.pl/wiadomosci-z-kraju,3.xml',
		'https://rss.gazeta.pl/pub/rss/gazetawyborcza_kraj.xml',
		'https://rss.gazeta.pl/pub/rss/gazetawyborcza_swiat.xml',
		'https://fakty.interia.pl/feed',
		'https://gry.interia.pl/feed',
		'https://www.rmf24.pl/fakty/feed',
		'https://www.rmf24.pl/fakty/polska/feed',
		'https://www.rmf24.pl/fakty/swiat/feed',
		'https://www.rmf24.pl/ekonomia/feed',
		'https://www.rmf24.pl/nauka/feed',
		'https://www.winespectator.com/rss/rss?t=news',
		'https://www.fxstreet.com/rss'
	])
]
