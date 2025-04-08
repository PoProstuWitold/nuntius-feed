'use client'

import { LogOutIcon } from 'lucide-react'
import { client } from '../utils/client-rpc'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
    const router = useRouter()

	async function handleLogout() {
		try {
			const res = await client.api.auth.signout.$post()

            if (res.ok) {
				router.push('/login')
                router.refresh()
			} else {
				console.error('Logout failed')
			}
		} catch (err) {
			console.error('Logout error:', err)
		}
	}

	return (
		<li>
			<button
				onClick={handleLogout}
				className='flex items-center gap-3 w-full text-left'
			>
				<LogOutIcon size={18} /> Logout
			</button>
		</li>
	)
}
