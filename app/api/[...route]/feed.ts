import { Hono } from 'hono'
import { Feed, Item } from '../models'
import type { Env } from '../types'
import { FeedUtils } from '../utils/feed-utils'
import { isAdmin, isAuthWithCookies } from '../utils/middlewares'
import { validatorParamObjectId } from '../utils/schemas'

const app = new Hono<Env>()
	// List all available feeds (optionally with filters)
	.get('/', async (c) => {
		c.status(200)
		return c.json({
			success: true,
			message: 'Fetched all available feeds'
		})
	})
	// Get details of a single feed
	.get('/:id', validatorParamObjectId, async (c) => {
		c.status(200)
		return c.json({
			success: true,
			message: `Fetched feed with ID ${c.req.param('id')}`
		})
	})
	// Get all feed items from user's subscribed feeds (with pagination, sorting, etc.)
	.get('/items', async (c) => {
		c.status(200)
		return c.json({
			success: true,
			message: 'Fetched all user subscribed feed items'
		})
	})
	// Get details of a specific feed item (optional)
	.get('/:id/items', validatorParamObjectId, async (c) => {
		c.status(200)
		return c.json({
			success: true,
			message: `Fetched feed items for user subscribed feed with ID ${c.req.param('id')}`
		})
	})
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
				feed: updatedFeed,
				items: updatedItems
			})
		}

		const feed = await Feed.create(parsedFeed)
		const items = await Item.insertMany(
			parsedItems.map((item) => ({
				...item,
				feed: feed._id
			}))
		)

		c.status(200)
		return c.json({
			success: true,
			message: 'Created a new feed and items',
			feed,
			items
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
			console.log('deletedItems', deletedItems)

			const deletedFeed = await Feed.findByIdAndDelete(feedId)
			console.log('deletedFeed', deletedFeed)

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
		c.status(202)
		return c.json({
			success: true,
			message: 'Started refreshing all feeds'
		})
	})

export default app
