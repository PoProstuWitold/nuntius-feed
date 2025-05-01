import { parseFeed } from '@rowanmanning/feed-parser'
import pLimit from 'p-limit'
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
			updatedFeed.items = updatedItems.map((item) => item._id)
			await updatedFeed.save()

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

		// Final fallback
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

export const curatedFeedLinks = [
	...new Set([
		// ===== Germany =====
		// -- News --
		'https://newsfeed.zeit.de/autoren/S/Helmut_Schmidt/index.xml',
		'https://www.spiegel.de/international/index.rss',
		// -- Tech --
		'https://www.chip.de/rss/chip_komplett.xml',

		// ===== Hong Kong =====
		// -- News --
		'https://www.scmp.com/rss/91/feed',

		// ===== Poland =====
		// -- Business --
		'https://businessinsider.com.pl/.feed',
		'https://www.polsatnews.pl/rss/biznes.xml',
		// -- Gaming --
		'https://boop.pl/rss',
		'https://gry.interia.pl/feed',
		'https://naekranie.pl/feed/all.xml',
		'https://planetagracza.pl/feed/',
		'https://www.eurogamer.pl/feed',
		'https://www.gry-online.pl/rss/news.xml',
		// -- Government --
		'https://policja.pl/dokumenty/rss/1-rss-1.rss',
		'https://rss.nbp.pl/kursy/TabelaA.xml',
		'https://stat.gov.pl/rss/pl/5438/rss.xml',
		'https://www.sejm.gov.pl/rss.nsf/feed.xsp?symbol=NEWS',
		// -- History --
		'https://ipn.gov.pl/dokumenty/rss/1-rss-48.rss',
		// -- Military --
		'https://defence24.pl/_rss',
		// -- News --
		'https://android.com.pl/feed/',
		'https://antyweb.pl/feed',
		'https://bezprawnik.pl/feed/',
		'https://ciekawostkihistoryczne.pl/feed/',
		'https://fakty.interia.pl/feed',
		'https://kurierlubelski.pl/rss',
		'https://lowcygier.pl/feed/',
		'https://lowcygier.pl/polecane/feed/',
		'https://lowcygier.pl/tylko-promocje/feed/',
		'https://natemat.pl/rss/wszystkie',
		'https://next.gazeta.pl/pub/next/rssnext.htm',
		'https://pap-mediaroom.pl/rss.xml',
		'https://radiotvrepublika.pl/feed/',
		'https://rss.gazeta.pl/pub/rss/gazetawyborcza_kraj.xml',
		'https://rss.gazeta.pl/pub/rss/gazetawyborcza_swiat.xml',
		'https://tygodnik.interia.pl/feed',
		'https://wiadomosci.gazeta.pl/pub/rss/wiadomosci.xml',
		'https://www.dziennikwschodni.pl/rss',
		'https://www.infor.pl/.feed',
		'https://www.polsatnews.pl/rss/polska.xml',
		'https://www.polsatnews.pl/rss/swiat.xml',
		'https://www.polsatnews.pl/rss/wszystkie.xml',
		'https://www.pudelek.pl/rss2.xml',
		'https://www.purepc.pl/rss_all.xml',
		'https://www.rmf24.pl/ekonomia/feed',
		'https://www.rmf24.pl/fakty/feed',
		'https://www.rmf24.pl/fakty/polska/feed',
		'https://www.rmf24.pl/fakty/swiat/feed',
		'https://www.rmf24.pl/nauka/feed',
		'https://www.tvn24.pl/najnowsze.xml',
		'https://www.tvn24.pl/najwazniejsze.xml',
		'https://www.tvn24.pl/wiadomosci-z-kraju,3.xml',
		// -- Tech --
		'https://ithardware.pl/feed',
		'https://spidersweb.pl/api/post/feed/feed-gn',
		'https://www.benchmark.pl/rss/aktualnosci-pliki.xml',
		// 'https://www.chip.pl/feed', // Parse error; Mega źle jest zrobione
		'https://www.tvn24.pl/internet-hi-tech-media,40.xml',

		// ===== Russia =====
		// -- Culture --
		'https://www.rogerebert.com/feed',
		// -- News --
		'https://rt.com/rss/',
		'https://www.themoscowtimes.com/rss/news',

		// ===== UK =====
		// -- News --
		'https://feeds.bbci.co.uk/news/world/rss.xml',
		'https://www.theguardian.com/world/rss',

		// ===== USA =====
		// -- News --
		'https://feeds.npr.org/1004/rss.xml',
		'https://feeds.npr.org/1008/rss.xml',
		'https://feeds.npr.org/1045/rss.xml',
		'https://moxie.foxnews.com/google-publisher/latest.xml',
		'https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/section/world/rss.xml',
		// -- Sports --
		'http://rss.cnn.com/rss/edition_sport.rss',

		// ===== Uganda =====
		// -- News --
		'https://www.watchdoguganda.com/feed',

		// ===== WORLD =====
		// -- Business --
		'https://www.fxstreet.com/rss',
		// -- Culture --
		'https://www.artnews.com/feed/',
		'https://www.rollingstone.com/feed/',
		// -- Gaming --
		'https://www.eurogamer.net/feed',
		// -- News --
		'https://feeds.feedburner.com/BeMyTravelMuse',
		'https://feeds.feedburner.com/Theblondeabroad/ScWo',
		'https://feeds.feedburner.com/craftbeercom',
		'https://feeds.feedburner.com/media2',
		'https://feeds.feedburner.com/sekurak_full',
		'https://feeds.propublica.org/propublica/main',
		'https://theconversation.com/us/articles.atom',
		'https://www.babypips.com/feed.rss',
		'https://www.theverge.com/rss/index.xml',
		'https://www.vox.com/rss/index.xml',
		'https://www.winespectator.com/rss/rss?t=news',
		// -- Tech --
		'https://feeds.arstechnica.com/arstechnica/index/',
		'https://spectrum.ieee.org/rss/blog/tech-talk/fulltext',
		'https://tealtech.com/feed/',
		'https://techcrunch.com/feed/',
		'https://www.wired.com/feed'
	])
]
