'use client'
import { useState } from 'react'
import { toast } from 'react-toastify'
import type { PayloadUser } from '../api/types'
import { client } from '../utils/client-rpc'

export default function Profile({ user }: { user: PayloadUser | null }) {
	const [file, setFile] = useState<File | null>(null)

	if (!user) {
		return (
			<div className='alert alert-warning'>
				<span>Not logged in</span>
			</div>
		)
	}

	const handleImport = async () => {
		if (!file) {
			toast.error('No file selected')
			return
		}

		try {
			const formData = new FormData()
			formData.append('file', file)

			const res = await client.api.user.subscriptions.import.$post({
				body: formData
			})

			if (!res.ok) throw new Error('Failed to import file')

			const json = await res.json()
			toast.success(`Imported ${json.feeds.length} feeds`)
		} catch (err) {
			console.error(err)
			toast.error('Import failed')
		}
	}

	const exportSubscriptions = async () => {
		try {
			const res = await client.api.user.subscriptions.export.$get()
			const disposition = res.headers.get('Content-Disposition')
			const match = disposition?.match(/filename="(.+)"/)
			const filename = match?.[1] ?? 'nf_subscriptions.opml'

			const blob = await res.blob()
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = filename
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)

			toast.success('Subscriptions exported successfully!')
		} catch (err) {
			console.error('Error exporting subscriptions:', err)
			toast.error('Failed to export subscriptions')
		}
	}

	return (
		<div className='flex flex-col gap-4'>
			<div className='w-full'>
				<div className='space-y-2'>
					<p>
						<span className='font-semibold'>ID:</span>{' '}
						<code className='badge badge-neutral'>{user.sub}</code>
					</p>
					<p>
						<span className='font-semibold'>Name:</span>{' '}
						<span className='badge badge-primary'>{user.name}</span>
					</p>
					<p>
						<span className='font-semibold'>Email:</span>{' '}
						<span className='badge badge-accent'>{user.email}</span>
					</p>
					<p>
						<span className='font-semibold'>Role:</span>{' '}
						<span className='badge badge-secondary'>
							{user.role}
						</span>
					</p>
				</div>
			</div>
			<div className='divider'>Manage Your Feeds</div>
			<div className='flex flex-col md:flex-row gap-8'>
				{/* Export */}
				<div className='flex flex-col gap-4 flex-1'>
					<h1 className='text-2xl font-bold'>Export Subscriptions</h1>
					<p>
						Click the button below to export your subscriptions as
						an OPML file.
					</p>
					<button
						type='button'
						className='btn btn-primary max-w-xs'
						onClick={() => exportSubscriptions()}
					>
						Export as OPML
					</button>
				</div>

				<div className='divider md:divider-horizontal' />

				{/* Import */}
				<div className='flex flex-col gap-4 flex-1'>
					<h1 className='text-2xl font-bold'>Import Subscriptions</h1>
					<p>
						Upload a <code>xml</code> or <code>opml</code> file to
						import subscriptions
					</p>
					<div className='flex flex-col md:flex-row gap-4'>
						<input
							type='file'
							accept='.xml,.opml'
							onChange={(e) =>
								setFile(e.target.files?.[0] ?? null)
							}
							className='file-input file-input-bordered max-w-xs'
						/>
						<button
							type='button'
							className='btn btn-primary max-w-xs'
							onClick={handleImport}
							disabled={!file}
						>
							Import
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
