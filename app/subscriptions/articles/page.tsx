import { SubscriptionArticlesClientPage } from '@/app/components/SubscriptionArticlesClientPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Your Articles',
	description: 'Articles from your subscriptions'
}

export default async function SubscriptionsArticles() {
	return <SubscriptionArticlesClientPage />
}
