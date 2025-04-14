import { type NextRequest, NextResponse } from 'next/server'
import { client } from './app/utils/server-rpc'

export async function middleware(req: NextRequest) {
	const path = req.nextUrl.pathname

	if (
		path.startsWith('/_next') ||
		path.startsWith('/favicon.ico') ||
		path.match(/\.(png|jpg|jpeg|gif|svg|css|js|woff2?|ttf)$/) ||
		path === '/api/auth/me' ||
		path === '/api/auth/refresh-token'
	) {
		return NextResponse.next()
	}

	console.log('[middleware] Triggered:', path)

	const cookie = req.headers.get('cookie') || ''

	// Only for not logged in users
	const publicOnlyPaths = ['/login']

	// Only for logged in users
	const protectedPaths = ['/profile']

	let isLoggedIn = false

	// Try to get user info from the API
	const me = await client.api.auth.me.$get({ headers: { cookie } })

	if (me.status !== 401) {
		isLoggedIn = true
	} else {
		console.warn('[middleware] Access token expired, trying refresh...')

		const refreshRes = await client.api.auth['refresh-token'].$post({
			headers: { cookie }
		})

		if (refreshRes.ok) {
			console.info('[middleware] Token refreshed ✅')

			const setCookie = refreshRes.headers.get('set-cookie')
			const redirectUrl = new URL(req.url)
			redirectUrl.searchParams.set('refreshed', '1')

			const redirectRes = NextResponse.redirect(redirectUrl)
			if (setCookie) {
				redirectRes.headers.set('set-cookie', setCookie)
			}

			return redirectRes
		}
	}

	// Now we can redirect the user if needed
	if (isLoggedIn && publicOnlyPaths.includes(path)) {
		console.log(
			'[middleware] Redirecting logged-in user from public-only path:',
			path
		)
		return NextResponse.redirect(new URL('/', req.url))
	}

	if (!isLoggedIn && protectedPaths.some((p) => path.startsWith(p))) {
		console.log(
			'[middleware] Redirecting anon user from protected path:',
			path
		)
		return NextResponse.redirect(new URL('/login', req.url))
	}

	return NextResponse.next()
}
