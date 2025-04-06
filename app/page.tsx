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
			<h1 className='text-4xl font-bold lg:text-left text-center mb-4'>
				RSS Aggregator
			</h1>
			<p>{text}</p>
		</>
	)
}
