import type { Context } from 'hono'
import type { CookieOptions } from 'hono/utils/cookie'
import {
	EncryptJWT,
	type JWTPayload,
	SignJWT,
	jwtDecrypt,
	jwtVerify
} from 'jose'
import { nanoid } from 'nanoid'

const ACCESS_TOKEN_EXP = 60 * 5 // 5 minutes
const REFRESH_TOKEN_EXP = 60 * 60 * 24 * 30 // 30 days

const secret = new TextEncoder().encode(
	process.env.JWT_SIGNING_SECRET || 'dev-secret'
)
const encryptionSecret = new TextEncoder().encode(
	process.env.JWT_ENCRYPTION_SECRET || 'dev-secret'
)

const isProd = process.env.NODE_ENV === 'production'

export class Tokens {
	static accessExp = ACCESS_TOKEN_EXP
	static refreshExp = REFRESH_TOKEN_EXP

	static cookieOptions: CookieOptions = {
		httpOnly: true,
		secure: isProd,
		sameSite: 'Strict',
		path: '/'
	}

	static setCookie(c: Context, name: string, value: string, maxAge: number) {
		const attrs = [
			`${name}=${value}`,
			`Max-Age=${maxAge}`,
			`Path=${Tokens.cookieOptions.path}`,
			'HttpOnly',
			`SameSite=${Tokens.cookieOptions.sameSite}`,
			Tokens.cookieOptions.secure ? 'Secure' : ''
		]
			.filter(Boolean)
			.join('; ')

		c.header('Set-Cookie', attrs, { append: true })
	}

	static async create(payload: JWTPayload, expiresIn: number) {
		const now = Math.floor(Date.now() / 1000)

		return new SignJWT(payload)
			.setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
			.setJti(nanoid())
			.setIssuedAt(now)
			.setExpirationTime(now + expiresIn)
			.sign(secret)
	}

	static async verify(token: string) {
		return jwtVerify(token, secret)
	}

	static async createEncrypted(payload: JWTPayload, expiresIn: number) {
		const now = Math.floor(Date.now() / 1000)

		return new EncryptJWT(payload)
			.setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
			.setJti(nanoid())
			.setIssuedAt(now)
			.setExpirationTime(now + expiresIn)
			.encrypt(encryptionSecret)
	}

	static async decrypt(token: string) {
		return jwtDecrypt(token, encryptionSecret)
	}
}
