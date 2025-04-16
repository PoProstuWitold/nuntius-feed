import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { openAPISpecs } from 'hono-openapi'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import mongoose from 'mongoose'

import pkg from '../../../package.json'
import type { Env } from '../types'
import {
	GenericException,
	errorHandler,
	responseTime
} from '../utils/middlewares'
import { connectDB } from '../utils/mongo'
import authRoutes from './auth'
import feedRoutes from './feed'
import userRoutes from './user'

const app = new Hono<Env>().basePath('/api')

// MongoDB connection
await connectDB()

// middlewares
app.use(compress())
app.use(
	cors({
		origin: process.env.NEXT_PUBLIC_APP_URL || '*',
		credentials: true,
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']
	})
)
app.use(logger())
app.use(
	prettyJSON({
		space: 4,
		query: 'pretty'
	})
)
app.use('*', requestId())
app.use('*', secureHeaders())
app.get('/openapi', openAPISpecs(app))
app.get(
	'/docs',
	Scalar({
		theme: 'saturn',
		url: '/api/openapi'
	})
)
app.onError(errorHandler)
app.notFound((c) => {
	throw new GenericException({
		name: 'Not Found',
		statusCode: 404,
		message: 'Route not found',
		details: [
			{
				route: `${c.req.method} ${c.req.path} doesn't exist`
			}
		]
	})
})
app.use(responseTime)

const routes = app
	.get('/v1', (c) =>
		c.text(
			'Your personal herald for the digital age. A lightweight web application for subscribing to and reading RSS and Atom feeds. Built with Next.js (frontend), Hono (backend via RPC) and secured with JSON Web Tokens (JWT).'
		)
	)
	.get('/health', (c) => {
		const mongoStatus = mongoose.connection.readyState === 1

		return c.json({
			status: 'ok',
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
			version: pkg.version,
			services: {
				mongodb: {
					connected: mongoStatus
				}
			}
		})
	})
	.route('/auth', authRoutes)
	.route('/feed', feedRoutes)
	.route('/user', userRoutes)

const GET = app.fetch
const POST = app.fetch
const PUT = app.fetch
const DELETE = app.fetch
const OPTIONS = app.fetch
const HEAD = app.fetch

export { GET, POST, PUT, DELETE, OPTIONS, HEAD }

export type AppType = typeof routes
