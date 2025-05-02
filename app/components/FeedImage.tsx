'use client'
import Image from 'next/image'
import { useState } from 'react'
import type { Feed } from '../types'

export const FeedImage = ({ feed }: { feed: Feed }) => {
	const [isVisible, setIsVisible] = useState(true)
	const [triedFallback, setTriedFallback] = useState(false)

	if (!feed.url || !isVisible) return null

	const originalUrl = feed.image?.url
	const fallbackUrl = `${new URL(feed.url).origin}/favicon.ico`
	const [url, setUrl] = useState(originalUrl || fallbackUrl)

	const alt = feed.image?.title || 'Feed logo'
	const title = feed.image?.title || 'Feed logo'

	return (
		<Image
			src={url}
			alt={alt}
			title={title}
			width={40}
			height={40}
			onError={() => {
				if (!triedFallback && url !== fallbackUrl) {
					setUrl(fallbackUrl)
					setTriedFallback(true)
				} else {
					setIsVisible(false)
				}
			}}
			onLoadingComplete={(img) => {
				if (img.naturalWidth === 0) setIsVisible(false)
			}}
			className='h-14 w-auto rounded-md bg-white p-2 shadow-sm border'
			unoptimized
		/>
	)
}
