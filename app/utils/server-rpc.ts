'use server'
import { hc } from 'hono/client'
import { cookies } from 'next/headers'
import type { AppType } from '../api/[...route]/route'

const baseUrl =
	process.env.NODE_ENV === 'development'
		? process.env.APP_LAN ?? 'http://localhost:3006'
		: process.env.APP_URL ?? 'http://localhost:3006'

export const client = hc<AppType>(baseUrl, {
	fetch: async (input, reqInit, _env, _ctx) => {
		const response = await fetch(input, {
			...reqInit,
			credentials: 'include',
			headers: {
				...reqInit?.headers,
				Cookie: (await cookies()).toString()
			}
		})
		return response
	}
})
