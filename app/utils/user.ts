import type { PayloadUser } from '../types'
import { client } from './server-rpc'

export async function getUser() {
	let user: PayloadUser | null = null
	const res = await client.api.auth.me.$get()
	const json = await res.json()
	if (res.status === 200) {
		user = json.user as PayloadUser
	}
	return user
}
