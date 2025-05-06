import { CronJob } from 'cron'
import { FeedUtils } from './feed-utils'

export const job = CronJob.from({
	cronTime: '0,30 * * * *',
	onTick: async () => {
		console.info('Feed refresh job started')
		await FeedUtils.refreshAllFeeds().catch((err) => {
			console.error('Error refreshing feeds:', err)
			return
		})
		console.info('Feed refresh job finished')
	},
	start: false,
	timeZone: 'Europe/Warsaw'
})
