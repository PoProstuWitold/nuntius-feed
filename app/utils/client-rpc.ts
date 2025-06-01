import { hc } from 'hono/client'
import type { AppType } from '../api/[...route]/route'

export const client = hc<AppType>(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3006', {
	fetch: async (input, reqInit, _env, _ctx) => {
		const response = await fetch(input, {
			...reqInit,
			credentials: 'include'
		})
		return response
	}
})
