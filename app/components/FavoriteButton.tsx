'use client'

import { Star, StarOff } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'react-toastify'
import { client } from '../utils/client-rpc'

type Props = {
	itemId: string
	isFavorite: boolean
	onChange?: (newState: boolean) => void
}

export function FavoriteButton({ itemId, isFavorite, onChange }: Props) {
	const [favorited, setFavorited] = useState(isFavorite)
	const [isPending, startTransition] = useTransition()

	useEffect(() => {
		setFavorited(isFavorite)
	}, [isFavorite])

	const toggleFavorite = () => {
		startTransition(async () => {
			try {
				if (favorited) {
					await client.api.user.favorites[':id'].$delete({
						param: { id: itemId }
					})
					toast.info('Removed from favorites')
				} else {
					await client.api.user.favorites[':id'].$post({
						param: { id: itemId }
					})
					toast.success('Added to favorites')
				}
				setFavorited(!favorited)
				onChange?.(!favorited)
			} catch (err) {
				console.error(err)
				toast.error('Something went wrong')
			}
		})
	}

	return (
		<button
			onClick={toggleFavorite}
			disabled={isPending}
			className='text-yellow-500 hover:text-yellow-600 transition'
			title={favorited ? 'Remove from favorites' : 'Add to favorites'}
			type='button'
		>
			{favorited ? (
				<Star className='w-5 h-5 fill-current cursor-pointer' />
			) : (
				<StarOff className='w-5 h-5 cursor-pointer' />
			)}
		</button>
	)
}
