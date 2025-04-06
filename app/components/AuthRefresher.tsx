'use client'
import { useLayoutEffect } from 'react'
import { client } from '../utils/client-rpc'

export function AuthRefresher() {
	useLayoutEffect(() => {
		client.api.auth['refresh-token']
			.$post()
			.then((res) => {
				if (res.ok) console.info('Token refreshed')
				else console.warn('Refresh failed')
			})
			.catch((err) => console.warn('Refresh error', err))
	}, [])

	return null
}
