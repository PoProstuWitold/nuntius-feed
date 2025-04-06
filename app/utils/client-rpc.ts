import { hc } from 'hono/client'
import type { AppType } from '../api/[...route]/route'

export const client = hc<AppType>(`${process.env.NEXT_PUBLIC_APP_URL}`, {
	fetch: async (input, reqInit, _env, _ctx) => {
		const response = await fetch(input, {
			...reqInit,
			credentials: 'include'
		})
		return response
	}
})
