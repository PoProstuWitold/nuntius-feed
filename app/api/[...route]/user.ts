import { Hono } from 'hono'
import type { ObjectId } from 'mongoose'
import { Feed, Item, User } from '../models'
import type { Env } from '../types'
import { isAuthWithCookies } from '../utils/middlewares'
import { validatorParamObjectId } from '../utils/schemas'

const app = new Hono<Env>()
	// Get all feeds the user is subscribed to
	.get('/subscriptions', isAuthWithCookies, async (c) => {
		const user = c.get('user')

		const dbUser = await User.findById(user?.sub).populate('subscriptions')

		return c.json({
			success: true,
			subscriptions: dbUser?.subscriptions || []
		})
	})
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

		const dbUser = await User.findById(user?.sub).populate({
			path: 'favorites',
			populate: {
				path: 'feed',
				select: 'title url self'
			}
		})

		const reversedFavorites = (dbUser?.favorites || []).toReversed()

		return c.json({
			success: true,
			favorites: reversedFavorites
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
