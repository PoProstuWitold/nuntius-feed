'use client'

import { Newspaper } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { Feed } from '../types'
import { client } from '../utils/client-rpc'

export const FeedImage = ({ feed }: { feed: Feed }) => {
	const [isVisible, setIsVisible] = useState(true)
	const [url, setUrl] = useState<string | null>(null)
	const [showSkeleton, setShowSkeleton] = useState(true)

	useEffect(() => {
		const fetchFavicon = async () => {
			if (!feed.url) return

			try {
				const res = await client.api.favicon.$get({
					query: { url: feed.url }
				})
				const data = await res.json()
				if ('icon' in data) {
					setUrl(data.icon)
				} else setUrl(`${new URL(feed.url).origin}/favicon.ico`)
			} catch {
				setUrl(`${new URL(feed.url).origin}/favicon.ico`)
			}
		}
		fetchFavicon()
	}, [feed.url])

	useEffect(() => {
		const timeout = setTimeout(() => {
			setShowSkeleton(false)
		}, 5000)

		return () => clearTimeout(timeout)
	}, [])

	if (!feed.url || !isVisible || !url) {
		if (showSkeleton) {
			return <div className='skeleton h-14 w-14 p-2 rounded-md' />
		}
		return <Newspaper className='h-14 w-14 p-2 text-base-content/30' />
	}

	return (
		<Image
			src={url}
			alt={feed.image?.title || 'Feed icon'}
			title={feed.image?.title || 'Feed icon'}
			width={40}
			height={40}
			onError={() => setIsVisible(false)}
			onLoadingComplete={(img) => {
				if (img.naturalWidth === 0) setIsVisible(false)
			}}
			className='h-14 w-auto p-2'
			unoptimized
		/>
	)
}
