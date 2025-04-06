import './globals.css'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
	display: 'swap'
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
	display: 'swap'
})

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
	return (
		<html lang='en' className='bg-base-100 text-base-content'>
			<body
				className={`
					${geistSans.variable} 
					${geistMono.variable} 
					font-sans 
					min-h-screen 
					flex flex-col 
					p-5 
					antialiased
				`}
			>
				<main className='flex-grow w-full max-w-screen-sm mx-auto'>
					{children}
				</main>
			</body>
		</html>
	)
}
