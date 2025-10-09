'use client'
import Link from 'next/link'
import type { ComponentProps } from 'react'

export function SidebarLink(props: ComponentProps<typeof Link>) {
	return (
		<Link
			{...props}
			onClick={(e) => {
				props.onClick?.(e)
				const drawer = document.getElementById(
					'my-drawer-3'
				) as HTMLInputElement | null
				if (drawer) drawer.checked = false
			}}
		/>
	)
}
