import './globals.css'
import type { Metadata } from 'next'
import { Layout } from './components/Layout'
import { ThemeProvider } from './context/ThemeContext'

export const metadata: Metadata = {
	title: 'Nuntius Feed',
	description:
		'Your personal herald for the digital age. A lightweight web application for subscribing to and reading RSS and Atom feeds.'
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<ThemeProvider defaultTheme='system'>
			<Layout>{children}</Layout>
		</ThemeProvider>
	)
}
