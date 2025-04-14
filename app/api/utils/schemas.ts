import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { GenericException } from './middlewares'

const paramObjectId = z.object({
	id: z
		.string({
			message: 'Id must be a string'
		})
		.length(24, {
			message: 'Id must be 24 characters long'
		})
})

export const validatorParamObjectId = zValidator(
	'param',
	paramObjectId,
	async (result, _c) => {
		if (!result.success) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Invalid id',
				details: [
					{
						id:
							result.success === false
								? result.error.issues[0].message
								: 'Invalid id',
						value: String(result.data.id)
					}
				]
			})
		}
	}
)
