export default function NotFound() {
	return (
		<div className='flex items-center justify-center'>
			<div className='text-center'>
				<h1 className='text-5xl font-bold'>404</h1>
				<p className='py-6 text-2xl'>Page not found</p>
				<a href='/' className='btn btn-primary'>
					Go back home
				</a>
			</div>
		</div>
	)
}
