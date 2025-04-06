import type { Metadata } from 'next'
import Profile from '../components/Profile'
import { client } from '../utils/server-rpc'

export const metadata: Metadata = {
	title: 'Profile',
	description: 'Your profile page'
}

export default async function Login() {
	const res = await client.api.auth.me.$get()
	const { user } = await res.json()

	return (
		<>
			<h1 className='text-4xl font-bold lg:text-left text-center mb-4'>
				Profile
			</h1>
			<Profile user={user} />
		</>
	)
}
