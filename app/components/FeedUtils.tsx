'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

type Progress = {
	isRunning: boolean
	startedAt: string | null
	finishedAt: string | null
	total: number
	processed: number
	success?: number
	failed?: number
	created?: number
	updated?: number
}

export const FeedUtils = () => {
	const [refresh, setRefresh] = useState<Progress | null>(null)
	const [defaults, setDefaults] = useState<Progress | null>(null)

	useEffect(() => {
		const refreshSSE = new EventSource('/api/feed/refresh/status')
		const defaultsSSE = new EventSource('/api/feed/defaults/status')

		refreshSSE.onmessage = (e) => {
			setRefresh(JSON.parse(e.data))
		}
		defaultsSSE.onmessage = (e) => {
			setDefaults(JSON.parse(e.data))
		}

		return () => {
			refreshSSE.close()
			defaultsSSE.close()
		}
	}, [])

	const trigger = async (path: 'refresh' | 'defaults') => {
		toast(`Starting ${path}...`, {
			type: 'info',
			theme: 'colored'
		})
		await fetch(`/api/feed/${path}`, { method: 'POST' })
	}

	const formatTime = (timestamp: string | null) =>
		timestamp ? new Date(timestamp).toLocaleString() : '-'

	const renderStats = (p: Progress, path: 'refresh' | 'defaults') => {
		const percentage =
			p.total > 0 ? Math.round((p.processed / p.total) * 100) : 0

		return (
			<div>
				<div className='divider' />
				<p className='font-semibold mb-2'>Progress</p>
				<progress
					className={`progress ${path === 'refresh' ? 'progress-primary' : 'progress-secondary'}`}
					value={percentage}
					max='100'
				/>
				<p className='text-sm mb-5'>
					{p.processed} / {p.total} ({percentage}%)
				</p>

				<p className='font-semibold'>Process info</p>
				<p>
					<span className='font-medium'>Status:</span>{' '}
					{p.isRunning ? 'Running' : 'Idle'}
				</p>
				<p>
					<span className='font-medium'>Started at:</span>{' '}
					{formatTime(p.startedAt)}
				</p>
				{p.finishedAt && (
					<p>
						<span className='font-medium'>Finished at:</span>{' '}
						{formatTime(p.finishedAt)}
					</p>
				)}

				<div className='divider' />
				<p className='font-semibold'>Items info</p>
				{typeof p.failed === 'number' && (
					<p>
						<span className='font-medium'>Failed:</span> {p.failed}
					</p>
				)}
				{typeof p.success === 'number' && (
					<p>
						<span className='font-medium'>Success:</span>{' '}
						{p.success}
					</p>
				)}
				{typeof p.created === 'number' && (
					<p>
						<span className='font-medium'>Created:</span>{' '}
						{p.created}
					</p>
				)}
				{typeof p.updated === 'number' && (
					<p>
						<span className='font-medium'>Updated:</span>{' '}
						{p.updated}
					</p>
				)}
			</div>
		)
	}

	return (
		<div className='mx-auto my-10'>
			<h1 className='text-2xl font-bold my-5'>Feed Utilities</h1>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
				<section className='border rounded-lg p-6 shadow-md bg-base-100'>
					<h2 className='text-xl font-semibold mb-4'>
						Refresh All Feeds
					</h2>
					<button
						onClick={() => trigger('refresh')}
						disabled={refresh?.isRunning}
						className='btn btn-primary mb-5'
						type='button'
					>
						{refresh?.isRunning ? 'Running...' : 'Start Refresh'}
					</button>
					{refresh ? (
						renderStats(refresh, 'refresh')
					) : (
						<p>Loading status...</p>
					)}
				</section>

				<section className='border rounded-lg p-6 shadow-md bg-base-100'>
					<h2 className='text-xl font-semibold mb-4'>
						Import Default Feeds
					</h2>
					<button
						onClick={() => trigger('defaults')}
						disabled={defaults?.isRunning}
						className='btn btn-secondary mb-5'
						type='button'
					>
						{defaults?.isRunning ? 'Running...' : 'Start Import'}
					</button>
					{defaults ? (
						renderStats(defaults, 'defaults')
					) : (
						<p>Loading status...</p>
					)}
				</section>
			</div>
		</div>
	)
}
