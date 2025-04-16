import type { Metadata } from 'next'
import { client } from './utils/server-rpc'

export const metadata: Metadata = {
	title: 'Nuntius Feed',
	description:
		'Your personal herald for the digital age. A lightweight web application for subscribing to and reading RSS and Atom feeds.'
}

export default async function Home() {
	const res = await client.api.v1.$get()
	const text = await res.text()

	return (
		<>
			<h1 className='text-4xl font-bold lg:text-left text-center mb-4'>
				Nuntius Feed
			</h1>
			<p>{text}</p>
		</>
	)
}
