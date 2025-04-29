import type { Metadata } from 'next'
import { AdminFeeds } from '../components/AdminFeeds'
import { FeedUtils } from '../components/FeedUtils'

export const metadata: Metadata = {
	title: 'Admin Dashboard',
	description: 'Admin dashboard for Nuntius Feed'
}

export default async function Dashboard() {
	return (
		<>
			<h1 className='text-4xl font-bold lg:text-left text-center mb-4'>
				Admin Dashboard
			</h1>
			<AdminFeeds />
			<FeedUtils />
		</>
	)
}
