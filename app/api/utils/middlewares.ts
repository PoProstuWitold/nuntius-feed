import type { Context } from 'hono'
import type { HTTPResponseError, Next } from 'hono/types'
import type { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status'
import { Tokens } from './tokens'

interface ExceptionOptions {
	statusCode: number
	message: string
	name?: string
	details?: Record<string, string>[]
}

export class GenericException extends Error {
	statusCode: StatusCode
	name: string
	details?: Record<string, string>[]

	constructor(options: ExceptionOptions) {
		super()
		this.statusCode = options.statusCode as StatusCode
		this.name = options.name || 'Internal Server Error'
		this.message = options.message
		this.details = options.details
	}
}

export const errorHandler = (err: Error | HTTPResponseError, c: Context) => {
	const message = err.message || 'Internal Server Error'
	const status: StatusCode = 500

	if (err instanceof GenericException) {
		return c.json(err, err.statusCode as ContentfulStatusCode)
	}

	const error: GenericException = {
		statusCode: status,
		name: 'Internal Server Error',
		message,
		stack: err.stack,
		cause: err.cause
	}

	return c.json(error, status)
}

export const responseTime = async (c: Context, next: Next) => {
	const start = Date.now()
	await next()
	const end = Date.now()
	c.res.headers.set('X-Response-Time', `${end - start}ms`)
}

export const isAuthWithCookies = async (c: Context, next: Next) => {
	const cookies = c.req.header('cookie')

	const accessToken = cookies
		?.split('; ')
		.find((c) => c.startsWith('access_token='))
		?.split('=')[1]

	if (accessToken) {
		try {
			const { payload } = await Tokens.verify(accessToken)
			c.set('user', payload)
			return await next()
		} catch {
			// no throwing error, maybe we can refresh token later
			console.warn('Access token expired or invalid')
			return c.json({ message: 'Unauthorized' }, 401)
		}
	}

	return c.json({ message: 'Unauthorized' }, 401)
}
