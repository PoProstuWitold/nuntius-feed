'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const themes = [
	'system',
	'light',
	'dark',
	'emerald',
	'retro',
	'cyberpunk',
	'valentine',
	'halloween',
	'winter',
	'business',
	'nord'
] as const

export type Theme = (typeof themes)[number]

interface ThemeContextType {
	theme: Theme
	setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({
	children,
	defaultTheme = 'system'
}: {
	children: React.ReactNode
	defaultTheme?: Theme
}) => {
	const [theme, setTheme] = useState<Theme>(defaultTheme)

	// biome-ignore lint: No more dependencies needed
	useEffect(() => {
		const savedTheme =
			(localStorage.getItem('theme') as Theme) || defaultTheme
		setTheme(savedTheme)
		applyTheme(savedTheme)
	}, [defaultTheme])

	const applyTheme = (newTheme: Theme) => {
		const root = document.documentElement
		const actualTheme =
			newTheme === 'system'
				? window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light'
				: newTheme

		root.setAttribute('data-theme', actualTheme)
		localStorage.setItem('theme', newTheme)
	}

	const changeTheme = (newTheme: Theme) => {
		setTheme(newTheme)
		applyTheme(newTheme)
	}

	return (
		<ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

export const useTheme = () => {
	const context = useContext(ThemeContext)
	if (!context)
		throw new Error('useTheme must be used within a ThemeProvider')

	return context
}
