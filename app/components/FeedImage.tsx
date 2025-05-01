'use client'
import Image from 'next/image'
import { useState } from 'react'
import type { Feed } from '../types'

export const FeedImage = ({ feed }: { feed: Feed }) => {
	const [isVisible, setIsVisible] = useState(true)

	if (!feed.image?.url || !feed.image?.title || !isVisible) return null

	return (
		<Image
			src={feed.image.url}
			alt={feed.image.title}
			title={feed.image.title}
			width={40}
			height={40}
			onError={() => setIsVisible(false)}
			onLoadingComplete={(img) => {
				if (img.naturalWidth === 0) setIsVisible(false)
			}}
			className='h-14 w-auto rounded-md bg-white p-2 shadow-sm border'
			unoptimized
		/>
	)
}
