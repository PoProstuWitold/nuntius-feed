import {
	Braces,
	Calendar,
	Computer,
	History,
	Settings,
	SquareActivity,
	Timer
} from 'lucide-react'
import type { Metadata } from 'next'
import { client } from '../utils/server-rpc'

export const metadata: Metadata = {
	title: 'NuntiusFeed Status',
	description: 'Check the status of the NuntiusFeed'
}

const formatUptime = (totalSeconds: number, includeSeconds = false) => {
	const units: [label: string, secs: number][] = [
		['day', 86400],
		['hour', 3600],
		['minute', 60],
		['second', 1]
	]
	if (!includeSeconds) units.pop()

	const parts: string[] = []
	let rest = Math.floor(totalSeconds)

	for (const [label, secs] of units) {
		const val = Math.floor(rest / secs)
		rest %= secs
		if (val > 0) parts.push(`${val} ${label}${val === 1 ? '' : 's'}`)
	}
	return parts.length ? parts.join(' ') : '0 minutes'
}

export default async function Status() {
	const res = await client.api.health.$get()

	if (!res.ok) {
		return (
			<main className='mx-auto max-w-2xl p-6'>
				<div className='rounded-2xl border shadow-sm p-6 bg-white/60'>
					<header className='flex items-center gap-3 mb-3'>
						<span className='rounded-2xl p-2 bg-gradient-to-tr from-rose-500 to-orange-400 text-white'>
							<SquareActivity className='h-7 w-7' />
						</span>
						<h1 className='text-2xl font-bold'>
							NuntiusFeed Status
						</h1>
					</header>
					<p className='text-sm text-gray-600'>
						Unable to fetch status information. Please try again
						later.
					</p>
				</div>
			</main>
		)
	}

	const json = await res.json()
	const ok = json.status === 'ok'

	return (
		<main className='mx-auto md:max-w-2xl p-2'>
			<section className='rounded-2xl p-5 bg-base-200 backdrop-blur'>
				<header className='flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<span className='rounded-2xl p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white'>
							<SquareActivity className='h-7 w-7' />
						</span>
						<div>
							<h1 className='text-2xl font-bold'>
								NuntiusFeed Status
							</h1>
						</div>
					</div>

					<span
						className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold ring-1 ${
							ok
								? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
								: 'bg-rose-100 text-rose-700 ring-rose-200'
						}`}
						title={`Overall status: ${json.status}`}
					>
						<span
							className={`h-3 w-3 rounded-full ${
								ok ? 'bg-emerald-500' : 'bg-rose-500'
							}`}
						/>
						{json.status.toUpperCase()}
					</span>
				</header>
				<p className='my-2'>{json.description}</p>

				<dl className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
					<div className='rounded-xl border p-4'>
						<dt className='text-sm flex items-center gap-2 text-base-content/70'>
							<History className='h-4 w-4' />
							App Version
						</dt>
						<dd className='font-mono'>{json.version}</dd>
					</div>

					<div className='rounded-xl border p-4'>
						<dt className='text-sm flex items-center gap-2 text-base-content/70'>
							<Braces className='h-4 w-4' />
							Node.js Version
						</dt>
						<dd className='font-mono'>{json.node}</dd>
					</div>

					<div className='rounded-xl border p-4'>
						<dt className='text-sm flex items-center gap-2 text-base-content/70'>
							<Computer className='h-4 w-4' />
							Runtime
						</dt>
						<dd className='font-mono'>
							{json.isDocker
								? 'Docker (container)'
								: 'Node.js (host)'}
						</dd>
					</div>

					<div className='rounded-xl border p-4'>
						<dt className='text-sm flex items-center gap-2 text-base-content/70'>
							<Timer className='h-4 w-4' />
							Uptime
						</dt>
						<dd className='font-mono'>
							{formatUptime(json.uptime)}
						</dd>
					</div>

					<div className='rounded-xl border p-4 sm:col-span-2'>
						<dt className='text-sm flex items-center gap-2 text-base-content/70'>
							<Calendar className='h-4 w-4' />
							Timestamp
						</dt>
						<dd className='font-mono'>{json.timestamp}</dd>
					</div>
				</dl>

				<h2 className='my-3 font-semibold flex items-center gap-2'>
					<Settings className='h-5 w-5' />
					Services
				</h2>
				<ul className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
					{Object.entries(json.services).map(([key, value]) => (
						<li
							key={key}
							className='rounded-xl border p-4 flex items-center justify-between'
						>
							<div className='flex items-center gap-2 font-medium'>
								<span
									className={`h-3 w-3 rounded-full ${
										value.connected
											? 'bg-emerald-500'
											: 'bg-rose-500'
									}`}
								/>
								{key}
							</div>
							<span
								className={`badge badge-neutral font-semibold`}
							>
								{value.connected
									? `Connected${value.latencyMs != null ? ` · ${value.latencyMs}ms` : ''}`
									: 'Disconnected'}
							</span>
						</li>
					))}
				</ul>
			</section>
		</main>
	)
}
