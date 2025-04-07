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
	const res = NextResponse.next()

	const me = await client.api.auth.me.$get({
		headers: { cookie }
	})

	if (me.status !== 401) {
		console.log('[middleware] Access token NOT OK')
		return res
	}

	console.warn('[middleware] Access token expired, trying refresh...')

	const refreshRes = await client.api.auth['refresh-token'].$post({
		headers: { cookie }
	})

	if (refreshRes.ok) {
		console.info('[middleware] Token refreshed')

		const setCookie = refreshRes.headers.get('set-cookie')
		const redirectUrl = new URL(req.url)
		redirectUrl.searchParams.set('refreshed', '1')

		const redirectRes = NextResponse.redirect(redirectUrl)

		if (setCookie) {
			redirectRes.headers.set('set-cookie', setCookie)
		}

		return redirectRes
	}

	return res
}

export const config = {
	matcher: [
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		'/(api|trpc)(.*)'
	]
}
