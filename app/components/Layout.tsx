import {
	Bell,
	CodeIcon,
	HomeIcon,
	LogInIcon,
	MenuIcon,
	Newspaper,
	RssIcon,
	StarIcon,
	UserCog,
	UserIcon
} from 'lucide-react'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { setThemeScript } from '../utils/functions'
import { client } from '../utils/server-rpc'
import { LogoutButton } from './LogoutButton'
import { ThemeSwitcher } from './ThemeSwitcher'
import Image from 'next/image'

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
		<html
			lang='en'
			className='bg-base-100 text-base-content'
			suppressHydrationWarning
		>
			<head>
				{/* Inline script to load theme instantly server-side */}
				<script dangerouslySetInnerHTML={{ __html: setThemeScript }} />
			</head>
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
									<div className='divider divider-horizontal' />
								</div>
							</div>
							<div className='flex-1 px-2 font-bold text-lg'>
								<Link href='/'>
									<span className='flex items-center gap-2 text-center font-extrabold text-2xl text-primary'>
										<Image width={40} height={40} alt='Logo' src='/favicon.ico' />
										<span>
											<span className='text-[#1F3B66]'>Nuntius</span>
											<span className='text-[#F57C00]'>Feed</span>
										</span>
									</span>
								</Link>
							</div>
						</div>

						{/* Main content */}
						<main className='w-full px-5 py-10 flex-grow'>
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
							<div className='divider'>Navigation</div>
							<li>
								<Link
									href='/'
									className='flex items-center gap-3'
								>
									<HomeIcon size={18} /> Home
								</Link>
							</li>
							<li>
								<Link
									href='/articles'
									className='flex items-center gap-3'
								>
									<RssIcon size={18} /> All Articles
								</Link>
							</li>
							{user && (
								<>
									<li>
										<Link
											href='/subscriptions/articles'
											className='flex items-center gap-3'
										>
											<Newspaper size={18} /> Your Articles
										</Link>
									</li>
									<li>
										<Link
											href='/favorites'
											className='flex items-center gap-3'
										>
											<StarIcon size={18} /> Favorite Articles
										</Link>
									</li>
									<li>
										<Link
											href='/subscriptions'
											className='flex items-center gap-3'
										>
											<Bell size={18} /> Subscribed Channels
										</Link>
									</li>
									<li>
										<Link
											href='/profile'
											className='flex items-center gap-3'
										>
											<UserIcon size={18} /> Profile
										</Link>
									</li>
									{/* LOGOUT */}
									<LogoutButton />
								</>
							)}
							{!user && (
								<li>
									<Link
										href='/login'
										className='flex items-center gap-3'
									>
										<LogInIcon size={18} /> Login
									</Link>
								</li>
							)}
							<div className='divider'>Settings</div>
							<ThemeSwitcher />
							{user?.role === 'admin' && (
								<>
									<div className='divider'>Admin</div>
									<li>
										<Link
											href='/dashboard'
											className='flex items-center gap-3'
										>
											<UserCog size={18} /> Dashboard
										</Link>
									</li>
									<li>
										<Link
											href='/api'
											className='flex items-center gap-3'
										>
											<CodeIcon size={18} /> API
										</Link>
									</li>
								</>
							)}
						</ul>
					</div>
				</div>
			</body>
		</html>
	)
}
