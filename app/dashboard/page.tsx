import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Admin Dashboard',
	description: 'Admin dashboard for Nuntius Feed'
}

export default async function Dashboard() {
	return (
		<>
			<h1 className='text-4xl font-bold lg:text-left text-center mb-4'>
				Admin Dashboard
			</h1>
		</>
	)
}
