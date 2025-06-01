import { hc } from 'hono/client'
import type { AppType } from '../api/[...route]/route'

const baseUrl =
	typeof window !== 'undefined'
		? window.location.origin
		: 'http://localhost:3006'

export const client = hc<AppType>(baseUrl, {
	fetch: async (input, reqInit, _env, _ctx) => {
		const response = await fetch(input, {
			...reqInit,
			credentials: 'include'
		})
		return response
	}
})
