import { Hono } from 'hono'
import type { ObjectId } from 'mongoose'
import { Feed, Item, User } from '../models'
import type { Env, FeedData } from '../types'
import { isAuthWithCookies } from '../utils/middlewares'
import { validatorParamObjectId } from '../utils/schemas'

const app = new Hono<Env>()
	// Get all feeds the user is subscribed to
	.get('/subscriptions', isAuthWithCookies, async (c) => {
		const user = c.get('user')

		const limit = Number.parseInt(c.req.query('limit') || '12', 10)
		const offset = Number.parseInt(c.req.query('offset') || '0', 10)
		const search = c.req.query('search')?.trim() || ''

		const allowedSortBy = ['title', 'createdAt', 'updatedAt', 'published']
		let sortBy = c.req.query('sortBy') || 'title'
		if (!allowedSortBy.includes(sortBy)) {
			sortBy = 'title'
		}
		const sortOrder = c.req.query('sortOrder') === 'asc' ? 1 : -1
		const sortOptions = { [sortBy]: sortOrder }

		const dbUser = await User.findById(user?.sub).select('subscriptions')
		const allIds = dbUser?.subscriptions || []

		// biome-ignore lint: Irrelevant types that break RPC
		const filter: any = { _id: { $in: allIds } }
		if (search) {
			filter.$or = [
				{ title: { $regex: search, $options: 'i' } },
				{ url: { $regex: search, $options: 'i' } },
				{ self: { $regex: search, $options: 'i' } }
			]
		}

		const totalFeeds = await Feed.countDocuments(filter)

		const feeds = await Feed.find(filter, null, {
			limit,
			skip: offset,
			sort: sortOptions
		})

		const subscriptionsWithCount = await Promise.all(
			feeds.map(async (sub) => {
				const itemsCount = await Item.countDocuments({ feed: sub._id })
				return {
					...sub.toJSON(),
					itemsCount
				}
			})
		)

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
			subscriptions: subscriptionsWithCount,
			pagination
		})
	})
	.get('/subscriptions/all', isAuthWithCookies, async (c) => {
		const user = c.get('user')
		const search = c.req.query('search')?.trim() || ''

		const dbUser = await User.findById(user?.sub).select('subscriptions')
		const allIds = dbUser?.subscriptions || []

		// biome-ignore lint: Irrelevant types that break RPC
		const filter: any = { _id: { $in: allIds } }
		if (search) {
			filter.$or = [
				{ title: { $regex: search, $options: 'i' } },
				{ url: { $regex: search, $options: 'i' } },
				{ self: { $regex: search, $options: 'i' } }
			]
		}

		const feeds = await Feed.find(filter)

		const subscriptionsWithCount = await Promise.all(
			feeds.map(async (sub) => {
				const itemsCount = await Item.countDocuments({ feed: sub._id })
				return {
					...sub.toJSON(),
					itemsCount
				}
			})
		)

		return c.json({
			success: true,
			subscriptions: subscriptionsWithCount
		})
	})
	.get('/subscriptions/export', isAuthWithCookies, async (c) => {
		const user = c.get('user')

		const dbUser = await User.findById(user?.sub).select('subscriptions')
		const allIds = dbUser?.subscriptions || []
		const filter = { _id: { $in: allIds } }
		const feeds: FeedData[] = await Feed.find(filter, null, {
			sort: { title: 1 }
		})

		const opmlXml = `<?xml version="1.0" encoding="UTF-8"?>
		<opml version="2.0">
		<head>
			<title>NuntiusFeed Export</title>
			<dateCreated>${new Date().toUTCString()}</dateCreated>
			<ownerName>${user?.name}</ownerName>
			<ownerEmail>${user?.email}</ownerEmail>
		</head>
		<body>
		${feeds
			.map(
				(feed) => `<outline
			type="${feed.meta.type}"
			version="${feed.meta.version}"
			language="${feed.language}" 
			title="${feed.title}"
			xmlUrl="${feed.self}"
			htmlUrl="${feed.url}"
		/>`
			)
			.join('\n\t\t')}
		</body>
		</opml>`

		return c.text(opmlXml, 200, {
			'Content-Type': 'application/xml',
			'Content-Disposition': 'attachment; filename="nf_subs.xml"'
		})
	})
	.post('/subscriptions/import', isAuthWithCookies, async (c) => {
		const _user = c.get('user')

		// Check if the request has a file

		// Parse the OPML file

		// Try to find feeds in database. If not present, create them alongside items

		// Subscribe the user to the feeds

		// Return the feeds

		return c.json({
			success: true,
			message: 'Imported subscriptions',
			feeds: []
		})
	})
	// Get all articles from user subscribed feeds
	.get('/subscriptions/articles', isAuthWithCookies, async (c) => {
		const user = c.get('user')

		const limit = Number.parseInt(c.req.query('limit') || '12', 10)
		const offset = Number.parseInt(c.req.query('offset') || '0', 10)

		const allowedSortBy = ['createdAt', 'updatedAt', 'published', 'title']
		let sortBy = c.req.query('sortBy') || 'published'
		if (!allowedSortBy.includes(sortBy)) {
			sortBy = 'published'
		}
		const sortOrder = c.req.query('sortOrder') === 'asc' ? 1 : -1
		const sortOptions = { [sortBy]: sortOrder }

		const search = c.req.query('search')?.trim() || ''

		const dbUser = await User.findById(user?.sub).populate(
			'subscriptions',
			'_id'
		)
		// biome-ignore lint: Irrelevant types that break RPC
		const userFeedIds = dbUser?.subscriptions.map((f: any) => f._id) || []

		if (userFeedIds.length === 0) {
			return c.json({
				success: true,
				message: 'No subscriptions found',
				items: [],
				pagination: {
					totalItems: 0,
					totalPages: 0,
					currentPage: 1,
					hasNextPage: false,
					hasPreviousPage: false,
					nextPage: null,
					previousPage: null
				}
			})
		}

		const searchFilter = {
			feed: { $in: userFeedIds },
			...(search
				? {
						$or: [
							{ title: { $regex: search, $options: 'i' } },
							{ description: { $regex: search, $options: 'i' } }
						]
					}
				: {})
		}

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
			message: 'Fetched items from subscriptions',
			items,
			pagination
		})
	})
	// Check if user is subscribed to a single feed
	.get(
		'/subscriptions/:id',
		validatorParamObjectId,
		isAuthWithCookies,
		async (c) => {
			const user = c.get('user')
			const feedId = c.req.param('id')

			const dbUser = await User.findById(user?.sub)

			const isSubscribed = dbUser.subscriptions.some(
				(id: ObjectId | string) => id.toString() === feedId
			)
			return c.json({
				success: true,
				message: isSubscribed ? 'Subscribed' : 'Not subscribed',
				isSubscribed
			})
		}
	)
	// Subscribe to feed by ID
	.post(
		'/subscriptions/:id',
		validatorParamObjectId,
		isAuthWithCookies,
		async (c) => {
			const user = c.get('user')
			if (!user) return c.json({ message: 'Unauthorized' }, 401)

			const feedId = c.req.param('id')
			const dbUser = await User.findById(user.sub)
			if (!dbUser) return c.json({ message: 'User not found' }, 404)

			const feed = await Feed.findById(feedId)
			if (!feed) return c.json({ message: 'Feed not found' }, 404)

			if (
				dbUser.subscriptions.some(
					(id: ObjectId | string) => id.toString() === feedId
				)
			) {
				return c.json({ message: 'Already subscribed' }, 400)
			}

			dbUser.subscriptions.push(feed._id)
			await dbUser.save()

			return c.json({ success: true, message: 'Subscribed', feedId })
		}
	)
	// Unsubscribe from feed by ID
	.delete(
		'/subscriptions/:id',
		validatorParamObjectId,
		isAuthWithCookies,
		async (c) => {
			const user = c.get('user')
			if (!user) return c.json({ message: 'Unauthorized' }, 401)

			const feedId = c.req.param('id')
			const dbUser = await User.findById(user.sub)
			if (!dbUser) return c.json({ message: 'User not found' }, 404)

			dbUser.subscriptions = dbUser.subscriptions.filter(
				(id: ObjectId) => id.toString() !== feedId
			)

			await dbUser.save()

			return c.json({ success: true, message: 'Unsubscribed', feedId })
		}
	)
	// Get all favorite items
	.get('/favorites', isAuthWithCookies, async (c) => {
		const user = c.get('user')

		const limit = Number.parseInt(c.req.query('limit') || '12', 10)
		const offset = Number.parseInt(c.req.query('offset') || '0', 10)

		const allowedSortBy = ['createdAt', 'updatedAt', 'published', 'title']
		let sortBy = c.req.query('sortBy') || 'published'
		if (!allowedSortBy.includes(sortBy)) {
			sortBy = 'published'
		}
		const sortOrder = c.req.query('sortOrder') === 'asc' ? 1 : -1
		const sortOptions = { [sortBy]: sortOrder }

		const search = c.req.query('search')?.trim() || ''

		const dbUser = await User.findById(user?.sub).select('favorites')
		const favoriteIds = dbUser?.favorites || []

		const searchFilter = {
			_id: { $in: favoriteIds },
			...(search
				? {
						$or: [
							{ title: { $regex: search, $options: 'i' } },
							{ description: { $regex: search, $options: 'i' } }
						]
					}
				: {})
		}

		const favorites = await Item.find(searchFilter, null, {
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
			message: 'Fetched favorite items',
			favorites: favorites,
			pagination
		})
	})

	// Add favorite item
	.post(
		'/favorites/:id',
		validatorParamObjectId,
		isAuthWithCookies,
		async (c) => {
			const user = c.get('user')
			if (!user) return c.json({ message: 'Unauthorized' }, 401)

			const itemId = c.req.param('id')
			const dbUser = await User.findById(user.sub)
			if (!dbUser) return c.json({ message: 'User not found' }, 404)

			const item = await Item.findById(itemId)
			if (!item) return c.json({ message: 'Item not found' }, 404)

			if (
				dbUser.favorites.some(
					(id: ObjectId | string) => id.toString() === itemId
				)
			) {
				return c.json({ message: 'Already in favorites' }, 400)
			}

			dbUser.favorites.push(item._id)
			await dbUser.save()

			return c.json({
				success: true,
				message: 'Added to favorites',
				itemId
			})
		}
	)

	// Remove favorite item
	.delete(
		'/favorites/:id',
		validatorParamObjectId,
		isAuthWithCookies,
		async (c) => {
			const user = c.get('user')
			if (!user) return c.json({ message: 'Unauthorized' }, 401)

			const itemId = c.req.param('id')
			const dbUser = await User.findById(user.sub)
			if (!dbUser) return c.json({ message: 'User not found' }, 404)

			dbUser.favorites = dbUser.favorites.filter(
				(id: ObjectId) => id.toString() !== itemId
			)

			await dbUser.save()

			return c.json({
				success: true,
				message: 'Removed from favorites',
				itemId
			})
		}
	)

export default app
