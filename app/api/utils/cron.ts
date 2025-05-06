import { CronJob } from 'cron'
import { FeedUtils } from './feed-utils'

export const job = CronJob.from({
	cronTime: '0,30 * * * *', // Every 30 minutes
	onTick: async () => {
		console.info('Feed refresh job started')
		await FeedUtils.refreshAllFeeds().catch((err) => {
			console.error('Error refreshing feeds:', err)
		})
		console.info('Feed refresh job finished')
	},
	start: true,
	timeZone: 'Europe/Warsaw'
})
