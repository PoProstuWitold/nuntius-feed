import RssParser from 'rss-parser'
import {
	Channel,
	type ChannelData,
	type ChannelDocument,
	Item,
	type ItemData
} from '../models'
import { GenericException } from './middlewares'

export class RssUtils {
	static parser = new RssParser({
		maxRedirects: 10,
		timeout: 10000,
		defaultRSS: 2.0
	})

	// Function to validate RSS feed URL
	static validateRssChannelUrl(url: string): boolean {
		const rssFeedUrlPattern = /^(https?:\/\/[^\s]+)$/i
		return rssFeedUrlPattern.test(url)
	}

	// Function to parse RSS feed and return items
	static async parseRssChannel(url: string) {
		const rss = await RssUtils.parser.parseURL(url)
		const parsedItems: Omit<ItemData, 'channel'>[] = rss.items.map(
			(item) => ({
				title: item.title || 'No title',
				link: item.link || item.url,
				description: item.content || 'No description',
				author: item.author || 'Anonymous',
				category: item.categories?.join(', ') || 'No category',
				enclosure: item.enclosure,
				guid: item.guid || 'No GUID',
				pubDate:
					item.pubDate ||
					(item.isoDate && new Date(item.isoDate)) ||
					'Unknown publication date',
				source: url
			})
		)

		return {
			parsedChannel: {
				channelLink: url,
				title: rss.title,
				link: rss.link,
				description: rss.description,
				language: rss.language,
				copyright: rss.copyright,
				managingEditor: rss.managingEditor,
				webMaster: rss.webMaster,
				pubDate: rss.pubDate,
				lastBuildDate: rss.lastBuildDate,
				category: rss.category,
				generator: rss.generator,
				docs: rss.docs,
				cloud: rss.cloud,
				ttl: rss.ttl,
				image: rss.image
			} as ChannelData,
			parsedItems
		}
	}

	// Method to get the feed items
	static async getChannelWithItems(rssLink: string) {
		try {
			const isRssLinkValid = RssUtils.validateRssChannelUrl(rssLink)
			if (!isRssLinkValid) {
				throw new GenericException({
					message: 'Invalid RSS feed URL',
					statusCode: 400
				})
			}

			const { parsedChannel, parsedItems } =
				await RssUtils.parseRssChannel(rssLink)

			return {
				parsedChannel,
				parsedItems
			}
		} catch (err) {
			throw new GenericException({
				message: 'Error parsing RSS feed',
				statusCode: 400,
				name: 'Bad Request'
			})
		}
	}

	static async updateChannelWithItems(
		existingChannel: ChannelDocument,
		parsedChannel: ChannelData,
		parsedItems: Omit<ItemData, 'channel'>[]
	) {
		try {
			const updatedChannel = await Channel.findByIdAndUpdate(
				existingChannel._id,
				{
					...parsedChannel,
					$set: {
						lastBuildDate: new Date()
					}
				},
				{ new: true }
			)

			const updatedItems = await Promise.all(
				parsedItems.map((item) =>
					Item.findOneAndUpdate(
						{ guid: item.guid },
						{ ...item, channel: updatedChannel._id },
						{ upsert: true, new: true, setDefaultsOnInsert: true }
					)
				)
			)
			return {
				updatedChannel,
				updatedItems
			}
		} catch (err) {
			throw new GenericException({
				message: 'Error updating channel and items',
				statusCode: 400,
				name: 'Bad Request'
			})
		}
	}
}
