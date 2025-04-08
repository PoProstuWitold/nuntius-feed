import { Geist, Geist_Mono } from 'next/font/google'
import {
	MenuIcon,
	RssIcon,
	HomeIcon,
	UserIcon,
	CodeIcon,
	LogInIcon,
} from 'lucide-react'
import { client } from '../utils/server-rpc'
import { LogoutButton } from './LogoutButton'

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

export async function Layout({ children }: { children: React.ReactNode }) {
	const res = await client.api.auth.me.$get()
	const { user } = await res.json()

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
								<div className='flex items-center'>
									<label
										htmlFor='my-drawer-3'
										aria-label='open sidebar'
										className='btn btn-square btn-ghost'
									>
										<MenuIcon />
									</label>
									<div className='divider divider-horizontal'/>
								</div>
							</div>
							<div className='flex-1 px-2 font-bold text-lg'>
								<span className='flex items-center gap-2 text-center font-extrabold text-2xl text-primary'>
									<RssIcon size='32' />
									<span>RSS Aggregator</span>
								</span>
							</div>
						</div>

						{/* Main content */}
						<main className='w-full max-w-screen-sm px-4 py-8 flex-grow'>
							{children}
						</main>
					</div>

					{/* Sidebar */}
					<div className='drawer-side'>
						<label
							htmlFor='my-drawer-3'
							aria-label='close sidebar'
							className='drawer-overlay'
						/>
						<ul className='menu p-6 w-80 min-h-full bg-base-200 text-base-content gap-2'>
							<li>
								<a href='/' className='flex items-center gap-3'>
									<HomeIcon size={18} /> Home
								</a>
							</li>
							{user && (
								<>
									<li>
										<a href='/profile' className='flex items-center gap-3'>
											<UserIcon size={18} /> Profile
										</a>
									</li>
									{/* LOGOUT */}
									<LogoutButton />
								</>
							)}
							{!user && (
								<li>
									<a href='/login' className='flex items-center gap-3'>
										<LogInIcon size={18} /> Login
									</a>
								</li>
							)}
							<div className='divider' />
							<li>
								<a href='/api' className='flex items-center gap-3'>
									<CodeIcon size={18} /> API
								</a>
							</li>
						</ul>
					</div>
				</div>
			</body>
		</html>
	)
}
