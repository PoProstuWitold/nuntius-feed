import type { Context } from 'hono'
import mongoose from 'mongoose'
import pkg from '../../../package.json'

export const health = async (c: Context) => {
	const t0 = Date.now()
	let latency: number | null = null
	let mongoConnected = false

	try {
		await mongoose.connection.db?.admin().ping()
		latency = Date.now() - t0
		mongoConnected = true
	} catch {
		mongoConnected = false
	}

	const status = mongoConnected ? 'ok' : 'degraded'

	return c.json(
		{
			status,
			description: pkg.description,
			version: pkg.version,
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
			isDocker: Boolean(process.env.DOCKER),
			node: process.version,
			services: {
				mongodb: {
					connected: mongoConnected,
					latencyMs: latency ?? undefined
				}
			}
		},
		mongoConnected ? 200 : 503
	)
}
