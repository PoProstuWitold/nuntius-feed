export interface PayloadUser {
	sub: string
	name: string
	email: string
}

export type Env = {
	Variables: {
		user: PayloadUser | null
	}
}
