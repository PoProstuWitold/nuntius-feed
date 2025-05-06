'use client'

import { LogOutIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { client } from '../utils/client-rpc'

export function LogoutButton() {
	const router = useRouter()

	async function handleLogout() {
		try {
			const res = await client.api.auth.signout.$post()

			if (res.ok) {
				toast('Signed out successfully', {
					theme: 'colored',
					type: 'success'
				})
				router.push('/login')
				router.refresh()
			} else {
				toast.error('Invalid credentials')
			}
		} catch (err) {
			toast.error('Logout error')
		}
	}

	return (
		<li>
			<button
				type='button'
				onClick={handleLogout}
				className='flex items-center gap-3 w-full text-left'
			>
				<LogOutIcon size={18} /> Logout
			</button>
		</li>
	)
}
