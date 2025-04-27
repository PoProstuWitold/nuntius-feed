'use client'

import {
	BriefcaseIcon,
	CandyIcon,
	ChevronDownIcon,
	CloudIcon,
	GhostIcon,
	HeartIcon,
	LeafIcon,
	MonitorIcon,
	MoonIcon,
	SnowflakeIcon,
	SunIcon
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme()

	const themes = [
		{ name: 'system', label: 'System', icon: <MonitorIcon size={16} /> },
		{ name: 'light', label: 'Light', icon: <SunIcon size={16} /> },
		{ name: 'dark', label: 'Dark', icon: <MoonIcon size={16} /> },
		{ name: 'emerald', label: 'Emerald', icon: <LeafIcon size={16} /> },
		{
			name: 'valentine',
			label: 'Valentine',
			icon: <HeartIcon size={16} />
		},
		{
			name: 'halloween',
			label: 'Halloween',
			icon: <GhostIcon size={16} />
		},
		{ name: 'winter', label: 'Winter', icon: <SnowflakeIcon size={16} /> },
		{
			name: 'business',
			label: 'Business',
			icon: <BriefcaseIcon size={16} />
		},
		{ name: 'nord', label: 'Nord', icon: <CloudIcon size={16} /> }
	] as const

	return (
		<div className='dropdown'>
			<button
				className='btn btn-ghost w-full justify-between'
				type='button'
			>
				<span>Theme</span>
				<ChevronDownIcon size={16} />
			</button>
			<ul className='dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52 mt-2 max-h-96 overflow-y-auto'>
				{themes.map((item) => (
					<li key={item.name}>
						<button
							className='flex items-center gap-2'
							onClick={() => setTheme(item.name)}
							type='button'
						>
							{item.icon}
							{item.label}
						</button>
					</li>
				))}
			</ul>
		</div>
	)
}
