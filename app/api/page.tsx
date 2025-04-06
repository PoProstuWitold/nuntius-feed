import type { Metadata } from 'next'
import type { ServiceStatus } from '../types'
import { client } from '../utils/server-rpc'

export const metadata: Metadata = {
	title: 'API Health',
	description: 'Check the health of the API'
}

export default async function Api() {
	const res = await client.api.health.$get()
	const json = await res.json()

	return (
		<>
			<div className='bg-base-100'>
				<div>
					<h1 className='text-4xl font-bold lg:text-left text-center mb-4'>
						Hono API
					</h1>
					<p className='my-2'>RSS Aggregator Hono REST API info.</p>
					<p className='flex flex-row items-center gap-2 font-bold'>
						<span>Status:</span>
						<span
							className={`badge ${json.status === 'ok' ? 'badge-success' : 'badge-error'} font-bold`}
						>
							{json.status}
						</span>
					</p>

					<p>
						<span className='font-bold'>Uptime:</span>{' '}
						{json.uptime.toFixed(2)}s
					</p>
					<p>
						<span className='font-bold'>Timestamp:</span>{' '}
						{json.timestamp}
					</p>
					<p>
						<span className='font-bold'>Version:</span>{' '}
						{json.version}
					</p>

					<div>
						<p className='font-bold mt-4'>Services:</p>
						<ul className='list-disc list-inside'>
							{Object.entries(json.services).map(
								([key, value]: [string, ServiceStatus]) => (
									<li
										key={key}
										className='flex flex-row items-center gap-2 font-bold'
									>
										<span>{key}:</span>
										<span
											className={`badge ${value.connected ? 'badge-success' : 'badge-error'}`}
										>
											{value.connected
												? 'Connected'
												: 'Disconnected'}
										</span>
									</li>
								)
							)}
						</ul>
					</div>
				</div>
			</div>
		</>
	)
}
