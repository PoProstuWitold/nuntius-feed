import { Hono } from 'hono'
import { Channel, Item } from '../models'
import type { Env } from '../types'
import { isAdmin, isAuthWithCookies } from '../utils/middlewares'
import { RssUtils } from '../utils/rss-utils'
import { validatorParamObjectId } from '../utils/schemas'

const app = new Hono<Env>()
	// List all available RSS channels (optionally with filters)
	.get('/', async (c) => {
		c.status(200)
		return c.json({
			success: true,
			message: 'Fetched all available channels'
		})
	})
	// Get details of a single RSS channel
	.get('/:id', validatorParamObjectId, async (c) => {
		c.status(200)
		return c.json({
			success: true,
			message: `Fetched channel with ID ${c.req.param('id')}`
		})
	})
	// Get all channel items from user's subscribed channels (with pagination, sorting, etc.)
	.get('/items', async (c) => {
		c.status(200)
		return c.json({
			success: true,
			message: 'Fetched all user subscribed channel items'
		})
	})
	// Get details of a specific channel item (optional)
	.get('/:id/items', validatorParamObjectId, async (c) => {
		c.status(200)
		return c.json({
			success: true,
			message: `Fetched channel items for user subscribed channel with ID ${c.req.param('id')}`
		})
	})
	// ADMIN ROUTES
	// (Admin) Create new OR refresh (update, sync) a RSS channel
	.post('/', isAuthWithCookies, isAdmin, async (c) => {
		const { channelLink } = await c.req.json()
		const { parsedChannel, parsedItems } =
			await RssUtils.getChannelWithItems(channelLink)

		const existingChannel = await Channel.findOne({
			channelLink
		})

		if (existingChannel) {
			const { updatedChannel, updatedItems } =
				await RssUtils.updateChannelWithItems(
					existingChannel,
					parsedChannel,
					parsedItems
				)

			c.status(200)
			return c.json({
				success: true,
				message: 'Updated existing channel and items',
				channel: updatedChannel,
				items: updatedItems
			})
		}

		const channel = await Channel.create(parsedChannel)
		const items = await Item.insertMany(
			parsedItems.map((item) => ({
				...item,
				channel: channel._id
			}))
		)

		c.status(200)
		return c.json({
			success: true,
			message: 'Created a new channel and items',
			channel,
			items
		})
	})
	// (Admin) Delete RSS channel with items
	.delete(
		'/:id',
		validatorParamObjectId,
		isAuthWithCookies,
		isAdmin,
		async (c) => {
			const channelId = c.req.param('id')

			const deletedItems = await Item.deleteMany({
				channel: channelId
			})
			console.log('deletedItems', deletedItems)

			const deletedChannel = await Channel.findByIdAndDelete(channelId)
			console.log('deletedChannel', deletedChannel)

			c.status(200)
			return c.json({
				success: true,
				message: `Deleted ${deletedChannel ? '1' : 'no'} channel with ID ${c.req.param('id')} and their ${deletedItems.acknowledged ? deletedItems.deletedCount : 'zero'} items`
			})
		}
	)
	// (Admin) Refresh all RSS channels
	// This is a long-running task, so we should not block the request
	// and instead return a 202 Accepted response
	// and use a background job to refresh the channels
	.post('/refresh', isAuthWithCookies, isAdmin, async (c) => {
		c.status(202)
		return c.json({
			success: true,
			message: 'Started refreshing all channels'
		})
	})

export default app
