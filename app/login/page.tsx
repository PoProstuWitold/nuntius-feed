import type { Metadata } from 'next'
import AuthForm from '../components/AuthForm'

export const metadata: Metadata = {
	title: 'Login',
	description: 'Login to your account'
}

export default async function Login() {
	return (
		<>
			<h1 className='text-4xl font-bold mb-2'>Login</h1>
			<AuthForm />
		</>
	)
}
