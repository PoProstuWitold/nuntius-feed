'use client'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { client } from '../utils/client-rpc'

export const AdminFeeds = () => {
	const [url, setUrl] = useState('')
	const [loading, setLoading] = useState(false)

	const addOrRefreshFeed = async (feedLink: string) => {
		setLoading(true)
		try {
			const response = await client.api.feed.$post({
				json: { feedLink }
			})

			const result = await response.json()

			if (response.ok) {
				toast(result.message, {
					theme: 'colored',
					type: 'success'
				})
				setUrl('')
			} else {
				toast(result.message || 'Error adding or refreshing feed', {
					theme: 'colored',
					type: 'error'
				})
			}
		} catch (err) {
			console.error('Error adding or refreshing feed:', err)
			toast('Unexpected error occurred', {
				theme: 'colored',
				type: 'error'
			})
		} finally {
			setLoading(false)
		}
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (url.trim()) {
			addOrRefreshFeed(url.trim())
		} else {
			toast('URL cannot be empty', {
				theme: 'colored',
				type: 'warning'
			})
		}
	}

	return (
		<div className='mx-auto'>
			<h1 className='text-2xl font-bold mb-4'>Add or refresh feed</h1>
			<form onSubmit={handleSubmit} className='flex gap-2'>
				<input
					type='text'
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder='Enter feed URL'
					className='flex-1 p-2 border rounded'
					disabled={loading}
				/>
				<button
					type='submit'
					className='p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-blue-400'
					disabled={loading}
				>
					{loading ? 'Submitting...' : 'Submit'}
				</button>
			</form>
		</div>
	)
}
