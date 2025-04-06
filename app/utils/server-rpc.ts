'use server'
import { hc } from 'hono/client'
import { cookies } from 'next/headers'
import type { AppType } from '../api/[...route]/route'

if (!process.env.NEXT_PUBLIC_APP_URL) {
	throw new Error('NEXT_PUBLIC_APP_URL is not defined')
}

export const client = hc<AppType>(`${process.env.NEXT_PUBLIC_APP_URL}`, {
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
