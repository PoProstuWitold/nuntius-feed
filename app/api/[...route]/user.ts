import { Hono } from 'hono'
import type { Env } from '../types'
import { isAuthWithCookies } from '../utils/middlewares'
import { validatorParamObjectId } from '../utils/schemas'

const app = new Hono<Env>()
	// Get all RSS feeds the user is subscribed to
	.get('/feeds', isAuthWithCookies, async (c) => {
		const user = c.get('user')
		if (!user) return c.json({ message: 'Unauthorized' }, 401)

		c.status(200)
		return c.json({
			success: true,
			message: 'Fetched all user feeds'
		})
	})
	// Subscribe to RSS feed by ID
	.post(
		'/feeds/:id',
		validatorParamObjectId,
		isAuthWithCookies,
		async (c) => {
			const user = c.get('user')
			if (!user) return c.json({ message: 'Unauthorized' }, 401)

			c.status(200)
			return c.json({
				success: true,
				message: `Subscribed to feed with ID ${c.req.param('id')}`
			})
		}
	)
	// Unsubscribe from RSS feed by ID
	.delete(
		'/feeds/:id',
		validatorParamObjectId,
		isAuthWithCookies,
		async (c) => {
			const user = c.get('user')
			if (!user) return c.json({ message: 'Unauthorized' }, 401)

			c.status(200)
			return c.json({
				success: true,
				message: `Unsubscribed from feed with ID ${c.req.param('id')}`
			})
		}
	)

export default app
