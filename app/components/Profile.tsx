import type { PayloadUser } from '../api/types'

export default function Profile({ user }: { user: PayloadUser | null }) {
	if (!user) {
		return <p>Not logged in</p>
	}

	return (
		<div>
			<p>ID: {user.sub}</p>
			<p>Name: {user.name}</p>
			<p>Email: {user.email}</p>
		</div>
	)
}
