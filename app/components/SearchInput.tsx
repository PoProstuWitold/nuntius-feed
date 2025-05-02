'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const SORT_FIELDS = [
	{ value: 'updatedAt', label: 'Last Updated' },
	{ value: 'createdAt', label: 'Created At' },
	{ value: 'title', label: 'Title' }
]

const SORT_ORDERS = [
	{ value: 'desc', label: 'Descending' },
	{ value: 'asc', label: 'Ascending' }
]

export function SearchInput() {
	const searchParams = useSearchParams()
	const router = useRouter()

	const [value, setValue] = useState(searchParams.get('search') || '')
	const [sortBy, setSortBy] = useState(
		searchParams.get('sortBy') || 'updatedAt'
	)
	const [sortOrder, setSortOrder] = useState(
		searchParams.get('sortOrder') || 'desc'
	)

	useEffect(() => {
		setValue(searchParams.get('search') || '')
		setSortBy(searchParams.get('sortBy') || 'updatedAt')
		setSortOrder(searchParams.get('sortOrder') || 'desc')
	}, [searchParams])

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const params = new URLSearchParams(searchParams.toString())

		if (value.trim()) {
			params.set('search', value.trim())
		} else {
			params.delete('search')
		}
		params.set('sortBy', sortBy)
		params.set('sortOrder', sortOrder)
		params.delete('page')

		window.location.href = `/?${params.toString()}`
	}

	return (
		<form onSubmit={onSubmit} className='mb-10 w-full'>
			<div className='grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-4 max-w-5xl mx-auto items-end'>
				<input
					type='text'
					placeholder='Search feeds...'
					className='input input-bordered w-full'
					value={value}
					onChange={(e) => setValue(e.target.value)}
				/>

				<select
					className='select select-bordered'
					value={sortBy}
					onChange={(e) => setSortBy(e.target.value)}
				>
					{SORT_FIELDS.map((option) => (
						<option key={option.value} value={option.value}>
							Sort: {option.label}
						</option>
					))}
				</select>

				<select
					className='select select-bordered'
					value={sortOrder}
					onChange={(e) => setSortOrder(e.target.value)}
				>
					{SORT_ORDERS.map((option) => (
						<option key={option.value} value={option.value}>
							Order: {option.label}
						</option>
					))}
				</select>

				<button type='submit' className='btn btn-primary'>
					Search
				</button>
			</div>
		</form>
	)
}
