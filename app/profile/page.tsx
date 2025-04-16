import type { Metadata } from 'next'
import Profile from '../components/Profile'
import { client } from '../utils/server-rpc'

export async function generateMetadata(): Promise<Metadata> {
	const res = await client.api.auth.me.$get()
	const { user } = await res.json()

	if (!user) {
		return {
			title: 'Profile',
			description: 'Your profile page'
		}
	}

	return {
		title: `${user.name}`,
		description: `Profile of ${user.name}`
	}
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
