import { Hono } from 'hono'
import { User } from '../models/User'
import type { Env } from '../types'
import { isAuthWithCookies } from '../utils/middlewares'
import { Tokens } from '../utils/tokens'

const app = new Hono<Env>()
	.post('/signup', async (c) => {
		const { name, email, password } = await c.req.json()
		const existing = await User.findOne({ email })
		if (existing) {
			return c.json({ message: 'User already exists' }, 400)
		}

		const user = await User.create({ name, email, password })

		const accessToken = await Tokens.create(
			{
				sub: user.id,
				name: user.name,
				email: user.email
			},
			Tokens.accessExp
		)
		const refreshToken = await Tokens.create(
			{
				sub: user.id,
				name: user.name,
				email: user.email
			},
			Tokens.refreshExp
		)

		Tokens.setCookie(c, 'access_token', accessToken, Tokens.accessExp)
		Tokens.setCookie(c, 'refresh_token', refreshToken, Tokens.refreshExp)

		return c.json({
			message: 'User created successfully',
			user: {
				id: user.id,
				name: user.name,
				email: user.email
			}
		})
	})
	.post('/signin', async (c) => {
		const { email, password } = await c.req.json()
		const user = await User.findOne({ email })
		if (!user || !(await user.verifyPassword(password))) {
			return c.json({ message: 'Invalid credentials' }, 401)
		}

		const accessToken = await Tokens.create(
			{
				sub: user.id,
				name: user.name,
				email: user.email
			},
			Tokens.accessExp
		)
		const refreshToken = await Tokens.create(
			{
				sub: user.id,
				name: user.name,
				email: user.email
			},
			Tokens.refreshExp
		)

		Tokens.setCookie(c, 'access_token', accessToken, Tokens.accessExp)
		Tokens.setCookie(c, 'refresh_token', refreshToken, Tokens.refreshExp)

		return c.json({
			message: 'User signed in successfully',
			user: {
				id: user.id,
				name: user.name,
				email: user.email
			}
		})
	})
	.post('/signout', async (c) => {
		Tokens.setCookie(c, 'access_token', '', 0)
		Tokens.setCookie(c, 'refresh_token', '', 0)

		return c.json({ message: 'User signed out successfully' })
	})
	.post('/refresh-token', async (c) => {
		const cookies = c.req.header('cookie')
		const refreshToken = cookies
			?.split('; ')
			.find((cookie) => cookie.startsWith('refresh_token='))
			?.split('=')[1]

		if (!refreshToken) {
			return c.json({ message: 'Missing refresh token' }, 401)
		}

		try {
			const { payload } = await Tokens.verify(refreshToken)
			const accessToken = await Tokens.create(
				{
					sub: payload.sub,
					name: payload.name,
					email: payload.email
				},
				Tokens.accessExp
			)

			Tokens.setCookie(c, 'access_token', accessToken, Tokens.accessExp)

			return c.json({
				message: 'Token refreshed successfully',
				accessToken,
				refreshToken
			})
		} catch {
			return c.json({ message: 'Invalid refresh token' }, 401)
		}
	})
	.get('/me', isAuthWithCookies, async (c) => {
		const user = c.get('user')
		return c.json({ user })
	})

export default app
