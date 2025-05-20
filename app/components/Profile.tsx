import type { PayloadUser } from '../api/types'

export default function Profile({ user }: { user: PayloadUser | null }) {
	if (!user) {
		return (
			<div className='alert alert-warning'>
				<span>Not logged in</span>
			</div>
		)
	}

	return (
		<div className='w-full'>
			<div className='space-y-2'>
				<p>
					<span className='font-semibold'>ID:</span>{' '}
					<code className='badge badge-neutral'>{user.sub}</code>
				</p>
				<p>
					<span className='font-semibold'>Name:</span>{' '}
					<span className='badge badge-primary'>{user.name}</span>
				</p>
				<p>
					<span className='font-semibold'>Email:</span>{' '}
					<span className='badge badge-accent'>{user.email}</span>
				</p>
				<p>
					<span className='font-semibold'>Role:</span>{' '}
					<span className='badge badge-secondary'>{user.role}</span>
				</p>
			</div>
		</div>
	)
}
