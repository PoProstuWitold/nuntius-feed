import type { Metadata } from 'next'
import { client } from './utils/server-rpc'

export const metadata: Metadata = {
	title: 'RSS Aggregator',
	description: 'Welcome to the RSS Aggregator'
}

export default async function Home() {
	const res = await client.api.v1.$get()
	const text = await res.text()

	return (
		<>
			<h1 className='text-4xl font-bold mb-2'>RSS Aggregator</h1>
			<p className='text-lg text-gray-600'>{text}</p>
		</>
	)
}
