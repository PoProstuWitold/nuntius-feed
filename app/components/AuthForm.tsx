'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { client } from '../utils/client-rpc'

type FormData = {
	name?: string
	email: string
	password: string
}

export default function AuthForm() {
	const router = useRouter()

	const [isLogin, setIsLogin] = useState(true)
	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<FormData>()

	const onSubmit = async (data: FormData) => {
		if (isLogin) {
			const res = await client.api.auth.signin.$post({
				json: data
			})
			if (res.ok) {
				const result = await res.json()
				console.info('Signed in:', result)
				toast('Signed in successfully', {
					theme: 'colored',
					type: 'success'
				})
				router.push('/profile')
				router.refresh()
			} else {
				toast.error('Invalid credentials')
			}
		} else {
			const res = await client.api.auth.signup.$post({ json: data })
			if (res.ok) {
				const result = await res.json()
				console.info('Signed up:', result)
				toast('Signed up successfully', {
					theme: 'colored',
					type: 'success'
				})
				router.push('/profile')
				router.refresh()
			} else {
				toast.error('Invalid data')
			}
		}
	}

	return (
		<div className='flex'>
			<div className='w-full max-w-lg'>
				<h1 className='text-4xl font-bold lg:text-left text-center mb-4'>
					{isLogin ? 'Sign in' : 'Sign up'}
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
						{isLogin ? 'Sign in' : 'Sign up'}
					</button>
				</form>

				<div className='text-center lg:text-left'>
					<button
						type='button'
						onClick={() => setIsLogin(!isLogin)}
						className='btn btn-link m-0 p-0'
					>
						{isLogin ? 'Switch to sign up' : 'Switch to sign in'}
					</button>
				</div>
			</div>
		</div>
	)
}
