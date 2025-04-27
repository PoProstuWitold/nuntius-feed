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

    const publicOnlyPaths = ['/login']
    const protectedPaths: (string | RegExp)[] = ['/profile']
    const adminPaths: (string | RegExp)[] = ['/api', '/dashboard']

    const isProtected = protectedPaths.some((route) =>
        route instanceof RegExp ? route.test(path) : route === path
    )
    const isAdminRoute = adminPaths.some((route) =>
        route instanceof RegExp ? route.test(path) : route === path
    )

    let isLoggedIn = false
    let user: any = null

    // Try to get user info from the API
    const me = await client.api.auth.me.$get({ headers: { cookie } })

    if (me.ok) {
        isLoggedIn = true
        user = await me.json()
		console.log('[middleware] User info:', user)
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

    const isAdmin = user?.user?.role === 'admin'

    if (isLoggedIn && publicOnlyPaths.includes(path)) {
        console.log('[middleware] Redirecting logged-in user from public-only path:', path)
        return NextResponse.redirect(new URL('/', req.url))
    }

    if (!isLoggedIn && isProtected) {
        console.log('[middleware] Redirecting anon user from protected path:', path)
        return NextResponse.redirect(new URL('/login', req.url))
    }

    if (isAdminRoute && !isAdmin) {
        console.log('[middleware] Redirecting non-admin user from admin path:', path)
        return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
}
