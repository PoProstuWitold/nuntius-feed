import type { Metadata } from 'next'
import { SubscriptionsClientPage } from '../components/SubscriptionsClientPage'
import { client } from '../utils/server-rpc'

export const metadata: Metadata = {
	title: 'Subscribed Channels',
	description: 'List of channels you are subscribed to'
}

export default async function Subscriptions() {
	const res = await client.api.user.subscriptions.$get()
	const data = await res.json()
	const subscriptions = data.subscriptions

	return <SubscriptionsClientPage initialSubscriptions={subscriptions} />
}
