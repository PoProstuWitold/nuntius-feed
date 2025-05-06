'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import type { PayloadUser } from '../types'
import { client } from '../utils/client-rpc'

const UserContext = createContext<PayloadUser | null>(null)

export const useUser = () => useContext(UserContext)

export function UserProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<PayloadUser | null>(null)
	useEffect(() => {
		async function fetchUser() {
			const res = await client.api.auth.me.$get()
			if (res.ok) {
				const userData = await res.json()
				setUser(userData.user)
			} else {
				setUser(null)
			}
		}
		fetchUser()
	}, [])

	return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function UserProviderWrapper({
	children
}: { children: React.ReactNode }) {
	return <UserProvider>{children}</UserProvider>
}
