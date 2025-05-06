import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import type { StatusCode } from 'hono/utils/http-status'
import { Feed, Item } from '../models'
import type { Env, FeedData, ItemData } from '../types'
import {
	FeedUtils,
	defaultsProgress,
	refreshProgress
} from '../utils/feed-utils'
import { isAdmin, isAuthWithCookies } from '../utils/middlewares'
import { validatorItemsQuery, validatorParamObjectId } from '../utils/schemas'

const app = new Hono<Env>()
	// List all available feeds (optionally with filters)
	.get('/', async (c) => {
		const limit = Number.parseInt(c.req.query('limit') || '12')
		const offset = Number.parseInt(c.req.query('offset') || '0')

		const allowedSortBy = ['createdAt', 'updatedAt', 'title']
		let sortBy = c.req.query('sortBy') || 'updatedAt'
		if (!allowedSortBy.includes(sortBy)) {
			sortBy = 'createdAt'
		}
		const sortOrder = c.req.query('sortOrder') === 'asc' ? 1 : -1
		const sortOptions = { [sortBy]: sortOrder }

		const search = c.req.query('search')?.trim()

		const searchFilter = search
			? {
					$or: [
						{ title: { $regex: search, $options: 'i' } },
						{ description: { $regex: search, $options: 'i' } },
						{ url: { $regex: search, $options: 'i' } },
						{ language: { $regex: search, $options: 'i' } },
						{ 'meta.type': { $regex: search, $options: 'i' } }
					]
				}
			: {}

		const feeds = await Feed.find(
			searchFilter,
			{ items: 0 },
			{
				limit,
				skip: offset,
				sort: sortOptions
			}
		).lean()

		const feedsWithItemsCount: (FeedData & {
			id: string
			itemsCount: number
			createdAt: Date
			updatedAt: Date
		})[] = (await Promise.all(
			feeds.map(async (feed) => {
				const itemsCount = await Item.countDocuments({ feed: feed._id })
				const { _id, __v, ...rest } = feed

				return {
					...rest,
					id: _id,
					itemsCount
				}
			})
		)) as (FeedData & {
			id: string
			itemsCount: number
			createdAt: Date
			updatedAt: Date
		})[]

		const totalFeeds = await Feed.countDocuments(searchFilter)
		const totalPages = Math.ceil(totalFeeds / limit)
		const currentPage = Math.floor(offset / limit) + 1
		const hasNextPage = offset + limit < totalFeeds
		const hasPreviousPage = offset > 0

		const pagination = {
			totalFeeds,
			totalPages,
			currentPage,
			hasNextPage,
			hasPreviousPage,
			nextPage: hasNextPage ? currentPage + 1 : null,
			previousPage: hasPreviousPage ? currentPage - 1 : null
		}

		return c.json({
			success: true,
			message: 'Fetched all available feeds',
			feeds: feedsWithItemsCount,
			pagination
		})
	})
	// Fetch articles from pagination with sort
	.get('/articles', async (c) => {
		const limit = Number.parseInt(c.req.query('limit') || '12')
		const offset = Number.parseInt(c.req.query('offset') || '0')

		const allowedSortBy = ['createdAt', 'updatedAt', 'published', 'title']
		let sortBy = c.req.query('sortBy') || 'published'
		if (!allowedSortBy.includes(sortBy)) {
			sortBy = 'published'
		}
		const sortOrder = c.req.query('sortOrder') === 'asc' ? 1 : -1
		const sortOptions = { [sortBy]: sortOrder }

		const search = c.req.query('search')?.trim() || ''

		const matchingFeeds = await Feed.find({
			$or: [
				{ title: { $regex: search, $options: 'i' } },
				{ url: { $regex: search, $options: 'i' } },
				{ self: { $regex: search, $options: 'i' } }
			]
		}).select('_id')

		const feedIds = matchingFeeds.map((f) => f._id)

		const searchFilter = search
			? {
					$or: [
						{ title: { $regex: search, $options: 'i' } },
						{ description: { $regex: search, $options: 'i' } },
						{ feed: { $in: feedIds } }
					]
				}
			: {}

		const items = await Item.find(searchFilter, null, {
			limit,
			skip: offset,
			sort: sortOptions,
			populate: {
				path: 'feed',
				select: 'title url self'
			}
		})

		const totalItems = await Item.countDocuments(searchFilter)
		const totalPages = Math.ceil(totalItems / limit)
		const currentPage = Math.floor(offset / limit) + 1
		const hasNextPage = offset + limit < totalItems
		const hasPreviousPage = offset > 0

		const pagination = {
			totalItems,
			totalPages,
			currentPage,
			hasNextPage,
			hasPreviousPage,
			nextPage: hasNextPage ? currentPage + 1 : null,
			previousPage: hasPreviousPage ? currentPage - 1 : null
		}

		return c.json({
			success: true,
			message: 'Fetched items',
			items,
			pagination
		})
	})
	// Get details of a single feed
	.get('/:id', validatorParamObjectId, async (c) => {
		const feedId = c.req.param('id')
		const feed = await Feed.findById(feedId, { items: 0 })

		let status = 200
		let response: {
			success: boolean
			message: string
			feed?: FeedData & {
				itemsCount: number
				updatedAt: string
				createdAt: string
				id: string
			}
		}

		if (!feed) {
			status = 404
			response = {
				success: false,
				message: `Feed with ID ${feedId} not found`
			}
		} else {
			const itemsCount = await Item.countDocuments({ feed: feed._id })
			const actualFeed: FeedData & {
				itemsCount: number
				updatedAt: string
				createdAt: string
				id: string
			} = {
				...(feed.toJSON() as FeedData),
				itemsCount,
				createdAt: feed.createdAt,
				updatedAt: feed.updatedAt,
				id: feed.id
			} as FeedData & {
				itemsCount: number
				updatedAt: string
				createdAt: string
				id: string
			}
			response = {
				success: true,
				message: `Fetched feed with ID ${feedId}`,
				feed: actualFeed
			}
		}

		c.status(status as StatusCode)
		return c.json(response)
	})
	// Get details of a specific feed items
	.get(
		'/:id/items',
		validatorParamObjectId,
		validatorItemsQuery,
		async (c) => {
			const feedId = c.req.param('id')

			const limit = Number.parseInt(c.req.query('limit') || '12')
			const offset = Number.parseInt(c.req.query('offset') || '0')

			const allowedSortBy = [
				'createdAt',
				'updatedAt',
				'published',
				'title'
			]
			let sortBy = c.req.query('sortBy') || 'published'
			if (!allowedSortBy.includes(sortBy)) {
				sortBy = 'createdAt'
			}
			const sortOrder = c.req.query('sortOrder') === 'asc' ? 1 : -1
			const sortOptions = { [sortBy]: sortOrder }

			const items = (await Item.find({ feed: feedId }, null, {
				limit,
				skip: offset,
				sort: sortOptions
			})) as (ItemData & {
				updatedAt: string
				createdAt: string
				id: string
			})[]

			const totalItems = await Item.countDocuments({ feed: feedId })
			const totalPages = Math.ceil(totalItems / limit)
			const currentPage = Math.floor(offset / limit) + 1
			const hasNextPage = offset + limit < totalItems
			const hasPreviousPage = offset > 0

			const pagination = {
				totalItems,
				totalPages,
				currentPage,
				hasNextPage,
				hasPreviousPage,
				nextPage: hasNextPage ? currentPage + 1 : null,
				previousPage: hasPreviousPage ? currentPage - 1 : null
			}

			const response: {
				success: boolean
				message: string
				pagination: {
					totalItems: number
					totalPages: number
					currentPage: number
					hasNextPage: boolean
					hasPreviousPage: boolean
					nextPage: number | null
					previousPage: number | null
				}
				items?: (ItemData & {
					updatedAt: string
					createdAt: string
					id: string
				})[]
			} = {
				success: true,
				message: `Fetched items for feed with ID ${feedId}`,
				items,
				pagination
			}

			return c.json(response)
		}
	)
	// ADMIN ROUTES
	// (Admin) Create new OR refresh (update, sync) a feed
	.post('/', isAuthWithCookies, isAdmin, async (c) => {
		const { feedLink } = await c.req.json()
		const { parsedFeed, parsedItems } =
			await FeedUtils.getFeedWithItems(feedLink)

		const existingFeed = await Feed.findOne({
			self: feedLink
		})

		if (existingFeed) {
			const { updatedFeed, updatedItems } =
				await FeedUtils.updateFeedWithItems(
					existingFeed,
					parsedFeed,
					parsedItems
				)

			c.status(200)
			return c.json({
				success: true,
				message: 'Updated existing feed and items',
				feed: {
					...updatedFeed.toJSON(),
					itemsCount: updatedItems.length
				}
			})
		}

		const feed = await Feed.create(parsedFeed)
		const items = await Item.insertMany(
			parsedItems.map((item) => ({
				...item,
				feed: feed._id
			}))
		)
		feed.items = items.map((item) => item._id)
		await feed.save()

		c.status(200)
		return c.json({
			success: true,
			message: 'Created a new feed and items',
			feed: {
				...feed.toJSON(),
				itemsCount: items.length
			}
		})
	})
	// (Admin) Delete feed with items
	.delete(
		'/:id',
		validatorParamObjectId,
		isAuthWithCookies,
		isAdmin,
		async (c) => {
			const feedId = c.req.param('id')

			const deletedItems = await Item.deleteMany({
				feed: feedId
			})

			const deletedFeed = await Feed.findByIdAndDelete(feedId)

			c.status(200)
			return c.json({
				success: true,
				message: `Deleted ${deletedFeed ? '1' : 'no'} feed with ID ${c.req.param('id')} and their ${deletedItems.acknowledged ? deletedItems.deletedCount : 'zero'} items`
			})
		}
	)
	// (Admin) Refresh all feeds
	// This is a long-running task, so we should not block the request
	// and instead return a 202 Accepted response
	// and use a background job to refresh the feeds
	.post('/refresh', isAuthWithCookies, isAdmin, async (c) => {
		FeedUtils.refreshAllFeeds().catch((err) => {
			console.error('Feed refresh error:', err)
		})

		c.status(202)
		return c.json({
			success: true,
			message: 'Started refreshing all feeds'
		})
	})
	.get('/refresh/status', isAuthWithCookies, isAdmin, (c) => {
		c.header('Content-Type', 'text/event-stream')
		c.header('Cache-Control', 'no-cache')
		c.header('Connection', 'keep-alive')
		return stream(c, async (stream) => {
			const send = () => {
				stream.write(`data: ${JSON.stringify(refreshProgress)}\n\n`)
			}

			send()
			const interval = setInterval(send, 1000)
			stream.onAbort(() => clearInterval(interval))
		})
	})
	.post('/defaults', isAuthWithCookies, isAdmin, async (c) => {
		FeedUtils.loadCuratedFeeds().catch((err) => {
			console.error('Feed defaults loading error:', err)
		})

		c.status(202)
		return c.json({
			success: true,
			message: 'Started importing curated feeds'
		})
	})
	.get('/defaults/status', isAuthWithCookies, isAdmin, (c) => {
		c.header('Content-Type', 'text/event-stream')
		c.header('Cache-Control', 'no-cache')
		c.header('Connection', 'keep-alive')
		return stream(c, async (stream) => {
			const send = () => {
				stream.write(`data: ${JSON.stringify(defaultsProgress)}\n\n`)
			}

			send()
			const interval = setInterval(send, 1000)
			stream.onAbort(() => clearInterval(interval))
		})
	})

export default app
