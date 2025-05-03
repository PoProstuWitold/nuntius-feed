'use client'

import { Bell, BellOff } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'react-toastify'
import { client } from '../utils/client-rpc'

type Props = {
	feedId: string
	isSubscribed: boolean
	onChange?: (newState: boolean) => void
}

export function SubscribeButton({ feedId, isSubscribed, onChange }: Props) {
	const [subscribed, setSubscribed] = useState(isSubscribed)
	const [isPending, startTransition] = useTransition()

	const toggleSubscription = () => {
		startTransition(async () => {
			try {
				if (subscribed) {
					await client.api.user.subscriptions[':id'].$delete({
						param: { id: feedId }
					})
					toast.info('Unsubscribed from feed')
				} else {
					await client.api.user.subscriptions[':id'].$post({
						param: { id: feedId }
					})
					toast.success('Subscribed to feed')
				}
				setSubscribed(!subscribed)
				onChange?.(!subscribed)
			} catch (err) {
				console.error(err)
				toast.error('Could not change subscription')
			}
		})
	}

	return (
		<button
			onClick={toggleSubscription}
			disabled={isPending}
			className='text-blue-500 hover:text-blue-600 transition'
			title={subscribed ? 'Unsubscribe' : 'Subscribe'}
			type='button'
		>
			{subscribed ? (
				<Bell className='w-5 h-5 fill-current' />
			) : (
				<BellOff className='w-5 h-5' />
			)}
		</button>
	)
}
