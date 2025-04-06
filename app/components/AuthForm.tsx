'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { client } from '../utils/client-rpc'

type FormData = {
	name?: string
	email: string
	password: string
}

export default function AuthForm() {
	const [isLogin, setIsLogin] = useState(true)
	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<FormData>()

	const onSubmit = async (data: FormData) => {
		if (isLogin) {
			// Sign In
			const res = await client.api.auth.signin.$post({
				json: data
			})
			if (res.ok) {
				const result = await res.json()
				console.info('Signed in:', result)
			} else {
				console.error('Sign in error')
			}
		} else {
			// Sign Up
			const res = await client.api.auth.signup.$post({ json: data })
			if (res.ok) {
				const result = await res.json()
				console.info('Signed up:', result)
			} else {
				console.error('Signed up error')
			}
		}
	}

	return (
		<div className='flex items-center justify-center min-h-screen'>
			<div className='w-full max-w-md p-8 space-y-6 '>
				<h1 className='text-2xl font-bold text-center'>
					{isLogin ? 'Login' : 'Register'}
				</h1>
				<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
					{!isLogin && (
						<div>
							<label htmlFor='name' className='label'>
								<span className='label-text'>Name</span>
							</label>
							<input
								id='name'
								{...register('name', { required: !isLogin })}
								className='input input-bordered w-full'
							/>
							{errors.name && (
								<span className='text-error'>
									This field is required
								</span>
							)}
						</div>
					)}
					<div>
						<label htmlFor='email' className='label'>
							<span className='label-text'>Email</span>
						</label>
						<input
							id='email'
							type='email'
							{...register('email', { required: true })}
							className='input input-bordered w-full'
						/>
						{errors.email && (
							<span className='text-error'>
								This field is required
							</span>
						)}
					</div>
					<div>
						<label htmlFor='password' className='label'>
							<span className='label-text'>Password</span>
						</label>
						<input
							id='password'
							type='password'
							{...register('password', { required: true })}
							className='input input-bordered w-full'
						/>
						{errors.password && (
							<span className='text-error'>
								This field is required
							</span>
						)}
					</div>
					<button type='submit' className='btn btn-primary w-full'>
						{isLogin ? 'Log in' : 'Register'}
					</button>
				</form>
				<div className='text-center'>
					<button
						type='button'
						onClick={() => setIsLogin(!isLogin)}
						className='btn btn-link'
					>
						{isLogin ? 'Switch to registration' : 'Switch to login'}
					</button>
				</div>
			</div>
		</div>
	)
}
