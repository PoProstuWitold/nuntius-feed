import type { Metadata } from 'next'
import { FavoritesClientPage } from '../components/FavoritesClientPage'
import { client } from '../utils/server-rpc'

export const metadata: Metadata = {
	title: 'Favorite Articles',
	description: 'List of your favorite articles'
}

export default async function Favorites() {
	const res = await client.api.user.favorites.$get()
	const data = await res.json()
	const items = data.favorites

	return <FavoritesClientPage initialItems={items} />
}
