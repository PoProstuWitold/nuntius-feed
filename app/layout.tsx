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
					antialiased
				`}
			>
				<div className='drawer lg:drawer-open'>
					<input
						id='my-drawer-3'
						type='checkbox'
						className='drawer-toggle'
					/>
					<div className='drawer-content flex flex-col'>
						{/* Navbar */}
						<div className='navbar bg-base-300'>
							<div className='flex-none lg:hidden'>
								<label
									htmlFor='my-drawer-3'
									aria-label='open sidebar'
									className='btn btn-square btn-ghost'
								>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										fill='none'
										viewBox='0 0 24 24'
										className='inline-block h-6 w-6 stroke-current'
										role='img'
										aria-label='menu'
									>
										<title>Menu</title>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth='2'
											d='M4 6h16M4 12h16M4 18h16'
										/>
									</svg>
								</label>
							</div>
							<div className='flex-1 px-2 font-bold text-lg'>
								RSS Aggregator
							</div>
						</div>

						{/* Main page content */}
						<main className='w-full max-w-screen-sm px-4 py-8 flex-grow'>
							{children}
						</main>
					</div>

					{/* Drawer sidebar */}
					<div className='drawer-side'>
						<label
							htmlFor='my-drawer-3'
							aria-label='close sidebar'
							className='drawer-overlay'
						/>
						<ul className='menu p-4 w-80 min-h-full bg-base-200'>
							<li>
								<a href='/'>Home</a>
							</li>
							<li>
								<a href='/profile'>Profile</a>
							</li>
							<li>
								<a href='/api'>API</a>
							</li>
							<li>
								<a href='/login'>Login</a>
							</li>
						</ul>
					</div>
				</div>
			</body>
		</html>
	)
}
