import './globals.css'
import type { Metadata } from 'next'
import { Layout } from './components/Layout'

export const metadata: Metadata = {
	title: 'RSS Aggregator',
	description:
		'A simple RSS aggregator built with Next.js, Hono and TypeScript'
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return <Layout>{children}</Layout>
}
